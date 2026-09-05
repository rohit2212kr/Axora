const Workspace = require("../models/Workspace");
const User = require("../models/user.model");
const Project = require("../models/project.model");
const Task = require("../models/taskModel");

/**
 * Create a new workspace
 * @route  POST /api/v1/workspaces
 * @access Private
 */
const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Edge Case: Validate workspace name
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Workspace name is required",
            });
        }

        // Create workspace with creator as owner
        const workspace = await Workspace.create({
            name,
            description,
            createdBy: req.user._id,
            members: [
                {
                    user: req.user._id,
                    role: "owner",
                },
            ],
        });

        // Fetch the newly created workspace with populated user data
        const populatedWorkspace = await Workspace.findById(workspace._id)
            .populate("createdBy", "name email")
            .populate("members.user", "name email");

        // Return created workspace with populated user data
        return res.status(201).json({
            success: true,
            data: populatedWorkspace,
        });
    } catch (error) {
        // Database or server error
        return res.status(500).json({
            success: false,
            message: "Server error while creating workspace",
            error: error.message,
        });
    }
};

/**
 * Invite a member to a workspace
 * @route  POST /api/v1/workspaces/invite
 * @access Private — only workspace Owner or Admin
 */
const inviteMember = async (req, res) => {
    try {
        const { workspaceId, email, role } = req.body;

        // Edge Case 1: Find the target user by email (never expose password)
        const targetUser = await User.findOne({ email }).select("-password");

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: "User with this email does not exist",
            });
        }

        // Fetch the workspace
        const workspace = await Workspace.findById(workspaceId);

        // Edge Case 2: Check if user is already a member
        const alreadyMember = workspace.members.some(
            (m) => m.user.toString() === targetUser._id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: "User is already a member of this workspace",
            });
        }

        // Add the new member — default to "member" role if none provided
        workspace.members.push({
            user: targetUser._id,
            role: role ? role.toLowerCase() : "member",
        });

        await workspace.save();

        // Re-fetch with populated fields so we never return raw ObjectIds
        const updatedWorkspace = await Workspace.findById(workspace._id)
            .populate("createdBy", "name email")
            .populate("members.user", "name email");

        return res.status(200).json({
            success: true,
            message: "Member added successfully",
            workspace: updatedWorkspace,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while inviting member",
            error: error.message,
        });
    }
};

/**
 * Get aggregated dashboard metrics for a workspace
 * @route  GET /api/v1/workspaces/:workspaceId/dashboard
 * @access Private — workspace members only
 */
const getWorkspaceDashboard = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        // Verify workspace exists
        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }

        // Access guard — user must be the creator or an existing member
        const requestingUserId = req.user._id.toString();
        const isOwner = workspace.createdBy.toString() === requestingUserId;
        const isMember = workspace.members.some(
            (m) => m.user.toString() === requestingUserId
        );

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        // Fetch all projects belonging to this workspace
        const projects = await Project.find({ workspace: workspaceId });
        const projectIds = projects.map((p) => p._id);

        // Aggregate metrics
        const totalProjects = projects.length;
        const activeProjects = projects.filter(
            (p) => p.status === "active" || p.status === "in_progress"
        ).length;

        const completedTasks = await Task.countDocuments({
            project: { $in: projectIds },
            status: "completed",
        });

        const pendingTasks = await Task.countDocuments({
            project: { $in: projectIds },
            status: { $ne: "completed" },
        });

        return res.status(200).json({
            success: true,
            data: {
                totalProjects,
                activeProjects,
                pendingTasks,
                completedTasks,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while fetching dashboard data",
            error: error.message,
        });
    }
};

module.exports = {
    createWorkspace,
    inviteMember,
    getWorkspaceDashboard,
};
