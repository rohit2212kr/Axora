const Task = require("../models/taskModel");
const Project = require("../models/project.model");
const Workspace = require("../models/Workspace");
const aiService = require("../services/aiService");

// Single source of truth for allowed task statuses
const VALID_STATUSES = ["todo", "in_progress", "in_review", "completed"];

/**
 * Helper — resolve the requesting user's role inside a workspace.
 * Returns the role string ("owner" | "admin" | "member") or null if not a member.
 *
 * @param {Object} workspace - Mongoose Workspace document
 * @param {string} userId    - Stringified user _id
 */
const getUserWorkspaceRole = (workspace, userId) => {
    // The workspace creator always has owner-level access
    if (workspace.createdBy.toString() === userId) return "owner";

    const entry = workspace.members.find((m) => m.user.toString() === userId);
    return entry ? entry.role : null;
};

/**
 * Create a new task inside a project
 * @route  POST /api/v1/workspaces/:workspaceId/projects/:projectId/tasks
 * @access Private — all workspace members (role-based assignment restriction applied inline)
 */
const createTask = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, description, status, priority, dueDate, assignedTo } = req.body;

        // Validation: title and dueDate are mandatory
        if (!title || !dueDate) {
            return res.status(400).json({
                success: false,
                message: "Task title and due date are required",
            });
        }

        // Fetch the parent project to get workspace context and member list
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Fetch workspace to determine the requesting user's role
        const workspace = await Workspace.findById(project.workspace);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }

        const requestingUserId = req.user._id.toString();
        const userRole = getUserWorkspaceRole(workspace, requestingUserId);

        if (!userRole) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        // Role enforcement: members can only assign tasks to themselves
        if (
            userRole === "member" &&
            assignedTo &&
            assignedTo.toString() !== requestingUserId
        ) {
            return res.status(403).json({
                success: false,
                message: "Members can only assign tasks to themselves",
            });
        }

        // If assignedTo is provided, the target user must exist in project.members
        if (assignedTo) {
            const isMember = project.members.some(
                (memberId) => memberId.toString() === assignedTo.toString()
            );

            if (!isMember) {
                return res.status(400).json({
                    success: false,
                    message: "Assigned user is not a member of this project",
                });
            }
        }

        // Persist the task
        let task = await Task.create({
            title,
            description,
            status,
            priority,
            dueDate,
            assignedTo: assignedTo || null,
            project: projectId,
            workspace: project.workspace,
            createdBy: req.user._id,
        });

        // Populate after creation (chaining on .create() is unreliable)
        task = await task.populate([
            { path: "assignedTo", select: "name email" },
            { path: "createdBy", select: "name email" },
        ]);

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            task,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while creating task",
            error: error.message,
        });
    }
};

/**
 * Get all tasks for a specific project
 * @route  GET /api/v1/workspaces/:workspaceId/projects/:projectId/tasks
 * @access Private — all workspace members
 */
const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;

        const tasks = await Task.find({ project: projectId })
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while fetching tasks",
            error: error.message,
        });
    }
};

/**
 * Update an existing task
 * @route  PUT /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
 * @access Private — members can only edit tasks assigned to themselves
 */
const updateTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const { title, description, status, priority, dueDate, assignedTo } = req.body;

        // Fetch the task
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Fetch project for workspace context and member list
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Fetch workspace for role resolution
        const workspace = await Workspace.findById(project.workspace);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }

        const requestingUserId = req.user._id.toString();
        const userRole = getUserWorkspaceRole(workspace, requestingUserId);

        if (!userRole) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        // Role enforcement for members
        if (userRole === "member") {
            // Members may only update tasks that are assigned to them
            if (task.assignedTo?.toString() !== requestingUserId) {
                return res.status(403).json({
                    success: false,
                    message: "Members can only update tasks assigned to themselves",
                });
            }

            // Members cannot reassign tasks to someone else
            if (assignedTo && assignedTo.toString() !== requestingUserId) {
                return res.status(403).json({
                    success: false,
                    message: "Members cannot reassign tasks",
                });
            }
        }

        // Owners & admins: if reassigning, target must be a project member
        if ((userRole === "owner" || userRole === "admin") && assignedTo) {
            const isMember = project.members.some(
                (memberId) => memberId.toString() === assignedTo.toString()
            );

            if (!isMember) {
                return res.status(400).json({
                    success: false,
                    message: "Assigned user is not a member of this project",
                });
            }
        }

        // Strict status validation — reject any value not in the allowed enum
        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value. Allowed: todo, in_progress, in_review, completed",
            });
        }

        // Apply only the fields that were provided in the request body
        const updatableFields = { title, description, status, priority, dueDate, assignedTo };
        Object.keys(updatableFields).forEach((key) => {
            if (updatableFields[key] !== undefined) {
                task[key] = updatableFields[key];
            }
        });

        await task.save();

        // Populate after save
        await task.populate([
            { path: "assignedTo", select: "name email" },
            { path: "createdBy", select: "name email" },
        ]);

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while updating task",
            error: error.message,
        });
    }
};

/**
 * Delete a task
 * @route  DELETE /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
 * @access Private — Owner & Admin only
 */
const deleteTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;

        // Fetch the task
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Fetch project for workspace context
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Fetch workspace for role resolution
        const workspace = await Workspace.findById(project.workspace);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }

        const requestingUserId = req.user._id.toString();
        const userRole = getUserWorkspaceRole(workspace, requestingUserId);

        if (!userRole) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        // Only owners and admins can delete tasks
        if (userRole === "member") {
            return res.status(403).json({
                success: false,
                message: "Only Admins and Owners can delete tasks",
            });
        }

        await Task.findByIdAndDelete(taskId);

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while deleting task",
            error: error.message,
        });
    }
};

/**
 * Get tasks grouped by status for Kanban board view
 * @route  GET /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/kanban
 * @access Private — all workspace members
 */
const getKanbanTasks = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project exists
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Fetch all tasks for the project with populated user data
        const tasks = await Task.find({ project: projectId })
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email");

        // Group tasks into Kanban columns — unknown/empty statuses fall into 'todo'
        const kanban = {
            todo: [],
            in_progress: [],
            in_review: [],
            completed: [],
        };

        tasks.forEach((task) => {
            const column = VALID_STATUSES.includes(task.status) ? task.status : "todo";
            kanban[column].push(task);
        });

        return res.status(200).json({
            success: true,
            kanban,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while fetching Kanban tasks",
            error: error.message,
        });
    }
};

/**
 * Generate AI subtasks for a task using Google Gemini
 * @route  POST /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/ai-breakdown
 * @access Private — all workspace members
 */
const generateTaskSubtasks = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;

        // Fetch the task
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Verify the parent project exists
        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Call Gemini — may throw on API/parsing failure
        const subtaskTitles = await aiService.generateSubtasks(task.title, task.description);

        // Transform plain strings into subtask subdocuments
        const newSubtasks = subtaskTitles.map((step) => ({
            title: step,
            isCompleted: false,
        }));

        // Append to existing subtasks (does not overwrite previous runs)
        task.subtasks.push(...newSubtasks);
        await task.save();

        return res.status(200).json({
            success: true,
            message: "Subtasks generated successfully",
            subtasks: task.subtasks,
            task,
        });
    } catch (error) {
        console.error("Task Subtask Error:", error);
        // Return a user-friendly message — never leak raw AI/API errors to the client
        return res.status(500).json({
            success: false,
            message: "There was a problem while generating subtasks. Please try again.",
        });
    }
};

module.exports = {
    createTask,
    getProjectTasks,
    updateTask,
    deleteTask,
    getKanbanTasks,
    generateTaskSubtasks,
};
