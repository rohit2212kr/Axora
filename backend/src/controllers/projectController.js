const Project = require("../models/project.model");

/**
 * Create a new project inside a workspace
 * @route  POST /api/v1/workspaces/:workspaceId/projects
 * @access Private — Owner / Admin only (enforced by verifyWorkspaceRole in routes)
 */
const createProject = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { name, description, deadline, members } = req.body;

        // Validation: project name is mandatory
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Project name is required",
            });
        }

        // Build the members array and guarantee the creator is always included
        // Convert everything to strings first for safe deduplication
        const creatorId = req.user._id.toString();
        const memberIds = Array.isArray(members) ? members.map((id) => id.toString()) : [];

        if (!memberIds.includes(creatorId)) {
            memberIds.unshift(creatorId);
        }

        // Persist the project
        let project = await Project.create({
            name,
            description,
            deadline: deadline || null,
            members: memberIds,
            workspace: workspaceId,
            createdBy: req.user._id,
        });

        // Populate after creation — chaining .populate() on Project.create() is unreliable
        project = await project.populate([
            { path: "createdBy", select: "name email" },
            { path: "members", select: "name email" },
        ]);

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            project,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while creating project",
            error: error.message,
        });
    }
};

/**
 * Get all projects that belong to a specific workspace
 * @route  GET /api/v1/workspaces/:workspaceId/projects
 * @access Private — Owner / Admin / Member (enforced by verifyWorkspaceRole in routes)
 */
const getWorkspaceProjects = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const projects = await Project.find({ workspace: workspaceId })
            .populate("createdBy", "name email")
            .populate("members", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: projects.length,
            projects,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while fetching projects",
            error: error.message,
        });
    }
};

module.exports = {
    createProject,
    getWorkspaceProjects,
};
