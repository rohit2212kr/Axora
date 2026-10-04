const Task = require("../models/taskModel");
const Project = require("../models/project.model");
const Workspace = require("../models/Workspace");
const aiService = require("../services/aiService");
const { emitToProject } = require("../socket/socketHandler");

// Single source of truth for allowed task statuses
const VALID_STATUSES = ["todo", "in_progress", "in_review", "completed"];

// Standard population fields across task queries
const TASK_POPULATE = [
    { path: "assignedTo", select: "name email avatar" },
    { path: "createdBy", select: "name email avatar" },
    { path: "comments.user", select: "name email avatar" },
    { path: "activity.user", select: "name email avatar" },
];

/**
 * Helper — resolve the requesting user's role inside a workspace.
 * Returns the role string ("owner" | "admin" | "member") or null if not a member.
 *
 * @param {Object} workspace - Mongoose Workspace document
 * @param {string} userId    - Stringified user _id
 */
const getUserWorkspaceRole = (workspace, userId) => {
    if (!workspace) return null;
    // The workspace creator always has owner-level access
    if (workspace.createdBy?.toString() === userId) return "owner";

    const entry = workspace.members?.find((m) => m.user?.toString() === userId);
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
        const { title, description, status, priority, dueDate, assignedTo, labels } = req.body;

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

        // Validate and sanitize labels if provided
        let sanitizedLabels = [];
        if (Array.isArray(labels)) {
            sanitizedLabels = labels
                .filter((l) => l && l.name && l.name.trim().length > 0)
                .map((l) => ({
                    name: l.name.trim(),
                    color: l.color && /^#([0-9A-F]{3}){1,2}$/i.test(l.color) ? l.color : "#6366f1",
                }));
        }

        // Initial creation audit log
        const initialActivity = [
            {
                user: req.user._id,
                action: "TASK_CREATED",
                details: "created the task",
                timestamp: new Date(),
            },
        ];

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
            labels: sanitizedLabels,
            comments: [],
            activity: initialActivity,
        });

        // Populate after creation
        task = await task.populate(TASK_POPULATE);

        // Broadcast real-time event
        emitToProject(projectId, "task:created", {
            task,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
        });

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
            .populate(TASK_POPULATE)
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
 * Get a single task by ID
 * @route  GET /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
 *         GET /api/v1/tasks/:taskId
 * @access Private — all workspace members
 */
const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId).populate(TASK_POPULATE);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        const workspace = await Workspace.findById(task.workspace);
        const requestingUserId = req.user._id.toString();
        const userRole = getUserWorkspaceRole(workspace, requestingUserId);

        if (!userRole) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        return res.status(200).json({
            success: true,
            task,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while fetching task",
            error: error.message,
        });
    }
};

/**
 * Update an existing task
 * @route  PUT /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
 *         PUT /api/v1/tasks/:taskId
 * @access Private — members can only edit tasks assigned to themselves
 */
const updateTask = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const { title, description, status, priority, dueDate, assignedTo, subtasks, labels } = req.body;

        // Fetch the task
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Fetch project for workspace context and member list
        const project = await Project.findById(projectId || task.project);

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

        // ── Activity hooks for tracking modifications ──
        if (status && status !== task.status) {
            task.activity.push({
                user: req.user._id,
                action: "STATUS_CHANGED",
                details: `changed status from ${task.status.replace("_", " ")} to ${status.replace("_", " ")}`,
                timestamp: new Date(),
            });
        }

        if (priority && priority !== task.priority) {
            task.activity.push({
                user: req.user._id,
                action: "PRIORITY_CHANGED",
                details: `changed priority from ${task.priority} to ${priority}`,
                timestamp: new Date(),
            });
        }

        if (assignedTo !== undefined && String(assignedTo || "") !== String(task.assignedTo || "")) {
            task.activity.push({
                user: req.user._id,
                action: "ASSIGNEE_CHANGED",
                details: assignedTo ? "reassigned the task" : "unassigned the task",
                timestamp: new Date(),
            });
        }

        if (dueDate && new Date(dueDate).getTime() !== new Date(task.dueDate).getTime()) {
            task.activity.push({
                user: req.user._id,
                action: "DUE_DATE_CHANGED",
                details: `updated due date to ${new Date(dueDate).toLocaleDateString()}`,
                timestamp: new Date(),
            });
        }

        if (Array.isArray(labels)) {
            const sanitizedLabels = labels
                .filter((l) => l && l.name && l.name.trim().length > 0)
                .map((l) => ({
                    name: l.name.trim(),
                    color: l.color && /^#([0-9A-F]{3}){1,2}$/i.test(l.color) ? l.color : "#6366f1",
                }));

            task.labels = sanitizedLabels;
            task.activity.push({
                user: req.user._id,
                action: "LABELS_UPDATED",
                details: sanitizedLabels.length > 0
                    ? `updated labels to: ${sanitizedLabels.map((l) => l.name).join(", ")}`
                    : "cleared labels",
                timestamp: new Date(),
            });
        }

        // Apply only scalar fields that were provided
        const updatableFields = { title, description, status, priority, dueDate, assignedTo, subtasks };
        Object.keys(updatableFields).forEach((key) => {
            if (updatableFields[key] !== undefined) {
                task[key] = updatableFields[key];
            }
        });

        await task.save();

        // Populate after save
        await task.populate(TASK_POPULATE);

        // Broadcast real-time event
        emitToProject(task.project || projectId, "task:updated", {
            task,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
        });

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
 * Add a comment to a task
 * @route  POST /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/comments
 *         POST /api/v1/tasks/:taskId/comments
 * @access Private — all workspace members
 */
const addComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment text is required",
            });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Workspace access check
        const workspace = await Workspace.findById(task.workspace);
        const requestingUserId = req.user._id.toString();
        const userRole = getUserWorkspaceRole(workspace, requestingUserId);

        if (!userRole) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        const trimmedText = text.trim();

        // Push new comment
        task.comments.push({
            user: req.user._id,
            text: trimmedText,
            createdAt: new Date(),
        });

        // Add activity log entry
        task.activity.push({
            user: req.user._id,
            action: "COMMENT_ADDED",
            details: `added a comment: "${trimmedText.substring(0, 45)}${trimmedText.length > 45 ? "..." : ""}"`,
            timestamp: new Date(),
        });

        await task.save();
        await task.populate(TASK_POPULATE);

        const addedComment = task.comments[task.comments.length - 1];

        // Broadcast real-time event
        emitToProject(task.project, "task:comment", {
            taskId: task._id,
            comment: addedComment,
            comments: task.comments,
            activity: task.activity,
            task,
            action: "added",
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
        });
        emitToProject(task.project, "task:updated", {
            task,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Comment added successfully",
            comment: addedComment,
            comments: task.comments,
            activity: task.activity,
            task,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while adding comment",
            error: error.message,
        });
    }
};

/**
 * Delete a comment from a task
 * @route  DELETE /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/comments/:commentId
 *         DELETE /api/v1/tasks/:taskId/comments/:commentId
 * @access Private — Comment author or Workspace Admin/Owner
 */
const deleteComment = async (req, res) => {
    try {
        const { taskId, commentId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        const comment = task.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        // Workspace access check
        const workspace = await Workspace.findById(task.workspace);
        const requestingUserId = req.user._id.toString();
        const userRole = getUserWorkspaceRole(workspace, requestingUserId);

        if (!userRole) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        // Only author or admin/owner can delete comment
        const isAuthor = comment.user?.toString() === requestingUserId;
        const isPrivileged = userRole === "owner" || userRole === "admin";

        if (!isAuthor && !isPrivileged) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own comments unless you are a workspace admin or owner",
            });
        }

        // Remove comment subdocument
        task.comments.pull(commentId);

        // Record activity log
        task.activity.push({
            user: req.user._id,
            action: "COMMENT_DELETED",
            details: "deleted a comment",
            timestamp: new Date(),
        });

        await task.save();
        await task.populate(TASK_POPULATE);

        // Broadcast real-time event
        emitToProject(task.project, "task:comment", {
            taskId: task._id,
            commentId,
            comments: task.comments,
            activity: task.activity,
            task,
            action: "deleted",
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
        });
        emitToProject(task.project, "task:updated", {
            task,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
            comments: task.comments,
            activity: task.activity,
            task,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while deleting comment",
            error: error.message,
        });
    }
};

/**
 * Update labels for a task
 * @route  PUT /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/labels
 *         PUT /api/v1/tasks/:taskId/labels
 * @access Private — all workspace members
 */
const updateTaskLabels = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { labels } = req.body;

        if (!Array.isArray(labels)) {
            return res.status(400).json({
                success: false,
                message: "Labels must be an array of label objects ({ name, color })",
            });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        const workspace = await Workspace.findById(task.workspace);
        const requestingUserId = req.user._id.toString();
        const userRole = getUserWorkspaceRole(workspace, requestingUserId);

        if (!userRole) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        const sanitizedLabels = labels
            .filter((l) => l && typeof l.name === "string" && l.name.trim().length > 0)
            .map((l) => ({
                name: l.name.trim(),
                color: l.color && /^#([0-9A-F]{3}){1,2}$/i.test(l.color) ? l.color : "#6366f1",
            }));

        task.labels = sanitizedLabels;

        task.activity.push({
            user: req.user._id,
            action: "LABELS_UPDATED",
            details: sanitizedLabels.length > 0
                ? `updated labels to: ${sanitizedLabels.map((l) => l.name).join(", ")}`
                : "cleared all labels",
            timestamp: new Date(),
        });

        await task.save();
        await task.populate(TASK_POPULATE);

        // Broadcast real-time event
        emitToProject(task.project, "task:updated", {
            task,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Labels updated successfully",
            labels: task.labels,
            activity: task.activity,
            task,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while updating labels",
            error: error.message,
        });
    }
};

/**
 * Delete a task
 * @route  DELETE /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
 *         DELETE /api/v1/tasks/:taskId
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
        const project = await Project.findById(projectId || task.project);

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

        const targetProjectId = task.project || projectId;
        await Task.findByIdAndDelete(taskId);

        // Broadcast real-time event
        emitToProject(targetProjectId, "task:deleted", {
            taskId,
            projectId: targetProjectId,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
        });

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
        const tasks = await Task.find({ project: projectId }).populate(TASK_POPULATE);

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
 *         POST /api/v1/tasks/:taskId/ai-breakdown
 * @access Private — all workspace members
 */
const generateTaskSubtasks = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;

        // Fetch the task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        // Verify the parent project exists
        const project = await Project.findById(projectId || task.project);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        // Call Gemini — returns [{ title, estimatedMinutes }]
        const structuredSubtasks = await aiService.generateSubtasks(
            task.title,
            task.description
        );

        // Map to subdocuments — taskSchema stores title + isCompleted + estimatedMinutes
        const newSubtasks = structuredSubtasks.map(({ title, estimatedMinutes }) => ({
            title,
            estimatedMinutes: estimatedMinutes ?? 30,
            isCompleted: false,
        }));

        // Append — does not overwrite previous AI runs
        task.subtasks.push(...newSubtasks);

        // Record activity log
        task.activity.push({
            user: req.user._id,
            action: "AI_SUBTASKS_GENERATED",
            details: `generated ${newSubtasks.length} subtasks using Gemini AI`,
            timestamp: new Date(),
        });

        await task.save();
        await task.populate(TASK_POPULATE);

        // Broadcast real-time event
        emitToProject(task.project, "task:updated", {
            task,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
        });

        return res.status(200).json({
            success: true,
            message: `${newSubtasks.length} subtasks generated successfully`,
            subtasks: task.subtasks,
            activity: task.activity,
            task,
        });
    } catch (error) {
        console.error("Task Subtask Error:", error);

        // Surface quota errors as 429 so the client can show a meaningful message
        if (error.message?.includes("quota")) {
            return res.status(429).json({
                success: false,
                message: "AI quota exceeded. Please try again in a few minutes.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "There was a problem generating subtasks. Please try again.",
        });
    }
};

module.exports = {
    createTask,
    getProjectTasks,
    getTaskById,
    updateTask,
    deleteTask,
    getKanbanTasks,
    generateTaskSubtasks,
    addComment,
    deleteComment,
    updateTaskLabels,
};
