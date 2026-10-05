const crypto = require("crypto");
const Workspace = require("../models/Workspace");
const User = require("../models/user.model");
const Project = require("../models/project.model");
const Task = require("../models/taskModel");
const { sendEmail, buildInviteTemplate } = require("../utils/sendEmail");

/**
 * Helper — resolve user's role inside a workspace
 * @param {Object} workspace - Mongoose Workspace document
 * @param {string} userId    - Stringified user _id
 * @returns {string|null}    - "owner" | "admin" | "member" | "viewer" | null
 */
const getWorkspaceUserRole = (workspace, userId) => {
    if (!workspace || !userId) return null;
    const uid = userId.toString();
    if (workspace.createdBy?.toString() === uid) return "owner";
    const entry = workspace.members?.find((m) => (m.user?._id || m.user)?.toString() === uid);
    return entry ? entry.role : null;
};

/**
 * Get all workspaces the authenticated user belongs to
 * @route  GET /api/v1/workspaces
 * @access Private
 */
const getUserWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({ "members.user": req.user._id })
            .populate("createdBy", "name email")
            .populate("members.user", "name email")
            .populate("invitations.invitedBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: workspaces,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while fetching workspaces",
            error: error.message,
        });
    }
};

/**
 * Get workspace details by ID
 * @route  GET /api/v1/workspaces/:workspaceId
 * @access Private — workspace members only
 */
const getWorkspaceById = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        const workspace = await Workspace.findById(workspaceId)
            .populate("createdBy", "name email")
            .populate("members.user", "name email")
            .populate("invitations.invitedBy", "name email");

        if (!workspace) {
            return res.status(404).json({ success: false, message: "Workspace not found" });
        }

        const requestingUserId = req.user._id.toString();
        const userRole = getWorkspaceUserRole(workspace, requestingUserId);

        if (!userRole) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        const workspaceData = workspace.toObject();
        // Hide invite tokens from non-admins/non-owners
        if (userRole !== "owner" && userRole !== "admin") {
            delete workspaceData.invitations;
        }

        return res.status(200).json({
            success: true,
            data: workspaceData,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while fetching workspace",
            error: error.message,
        });
    }
};

/**
 * Create a new workspace
 * @route  POST /api/v1/workspaces
 * @access Private
 */
const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Workspace name is required",
            });
        }

        const workspace = await Workspace.create({
            name,
            description,
            createdBy: req.user._id,
            members: [
                {
                    user: req.user._id,
                    role: "owner",
                    joinedAt: new Date(),
                },
            ],
            invitations: [],
        });

        const populatedWorkspace = await Workspace.findById(workspace._id)
            .populate("createdBy", "name email")
            .populate("members.user", "name email");

        return res.status(201).json({
            success: true,
            data: populatedWorkspace,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while creating workspace",
            error: error.message,
        });
    }
};

/**
 * Create and send a workspace invitation link via email
 * @route  POST /api/v1/workspaces/:workspaceId/invites
 *         POST /api/v1/workspaces/invite (fallback)
 * @access Private — Owner & Admin only
 */
const createWorkspaceInvite = async (req, res) => {
    try {
        const workspaceId = req.params?.workspaceId || req.body?.workspaceId;
        const { email, role } = req.body;

        if (!workspaceId) {
            return res.status(400).json({ success: false, message: "Workspace ID is required" });
        }

        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: "Recipient email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedRole = role && ["admin", "member", "viewer"].includes(role.toLowerCase())
            ? role.toLowerCase()
            : "member";

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ success: false, message: "Workspace not found" });
        }

        const requestingUserId = req.user._id.toString();
        const userRole = getWorkspaceUserRole(workspace, requestingUserId);

        if (!userRole || (userRole !== "owner" && userRole !== "admin")) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Only Workspace Owners and Admins can invite members",
            });
        }

        // Check if user with this email is already a member
        const existingUser = await User.findOne({ email: normalizedEmail }).select("_id name email");
        if (existingUser) {
            const isAlreadyMember = workspace.members.some(
                (m) => (m.user?._id || m.user).toString() === existingUser._id.toString()
            );
            if (isAlreadyMember) {
                return res.status(400).json({
                    success: false,
                    message: "This user is already a member of this workspace",
                });
            }
        }

        // Generate crypto token & 7-day expiration
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Remove any previous pending invite for this email
        workspace.invitations = (workspace.invitations || []).filter(
            (i) => i.email !== normalizedEmail
        );

        workspace.invitations.push({
            email: normalizedEmail,
            role: normalizedRole,
            token,
            expiresAt,
            invitedBy: req.user._id,
            createdAt: new Date(),
        });

        await workspace.save();

        const clientUrl = process.env.CLIENT_URL || "https://axoraa-gray.vercel.app";
        const inviteUrl = `${clientUrl.replace(/\/+$/, "")}/invite/${token}`;

        // Send email via Brevo HTTPS API (or Nodemailer fallback)
        try {
            const html = buildInviteTemplate({
                workspaceName: workspace.name,
                inviterName: req.user.name || "A team member",
                role: normalizedRole,
                inviteUrl,
            });

            await sendEmail({
                to: normalizedEmail,
                subject: `You've been invited to join ${workspace.name} on Axora`,
                html,
                text: `${req.user.name || "A team member"} invited you to join ${workspace.name} on Axora as ${normalizedRole}. Accept invitation: ${inviteUrl}`,
            });
        } catch (emailError) {
            console.warn("Failed to dispatch invitation email:", emailError.message);
        }

        const updatedWorkspace = await Workspace.findById(workspace._id)
            .populate("createdBy", "name email")
            .populate("members.user", "name email")
            .populate("invitations.invitedBy", "name email");

        return res.status(201).json({
            success: true,
            message: `Invitation sent to ${normalizedEmail}`,
            inviteLink: inviteUrl,
            token,
            workspace: updatedWorkspace,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while creating invitation",
            error: error.message,
        });
    }
};

/**
 * Validate an invitation token and return workspace metadata
 * @route  GET /api/v1/workspaces/invite/:token
 * @access Public
 */
const validateInviteToken = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ success: false, message: "Invitation token is required" });
        }

        const workspace = await Workspace.findOne({ "invitations.token": token })
            .populate("invitations.invitedBy", "name email")
            .populate("createdBy", "name email");

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Invalid or expired invitation link",
            });
        }

        const invitation = workspace.invitations.find((i) => i.token === token);
        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found",
            });
        }

        if (new Date(invitation.expiresAt) < new Date()) {
            return res.status(410).json({
                success: false,
                message: "This invitation link has expired. Please ask for a new invite.",
                isExpired: true,
            });
        }

        return res.status(200).json({
            success: true,
            invitation: {
                workspaceId: workspace._id,
                workspaceName: workspace.name,
                workspaceDescription: workspace.description,
                email: invitation.email,
                role: invitation.role,
                inviterName: invitation.invitedBy?.name || "A team member",
                expiresAt: invitation.expiresAt,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while validating invitation",
            error: error.message,
        });
    }
};

/**
 * Accept a workspace invitation and join the workspace
 * @route  POST /api/v1/workspaces/invite/:token/accept
 * @access Private
 */
const acceptInvite = async (req, res) => {
    try {
        const { token } = req.params;
        const currentUserId = req.user._id.toString();

        const workspace = await Workspace.findOne({ "invitations.token": token });
        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Invalid or expired invitation link",
            });
        }

        const invitation = workspace.invitations.find((i) => i.token === token);
        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found",
            });
        }

        if (new Date(invitation.expiresAt) < new Date()) {
            return res.status(410).json({
                success: false,
                message: "This invitation link has expired",
            });
        }

        // Check if already a member
        const alreadyMember = workspace.members.some(
            (m) => (m.user?._id || m.user).toString() === currentUserId
        );

        if (alreadyMember) {
            // Clean up the used invitation token
            workspace.invitations = workspace.invitations.filter((i) => i.token !== token);
            await workspace.save();

            const populatedWorkspace = await Workspace.findById(workspace._id)
                .populate("createdBy", "name email")
                .populate("members.user", "name email");

            return res.status(200).json({
                success: true,
                message: "You are already a member of this workspace",
                workspace: populatedWorkspace,
            });
        }

        // Add member
        workspace.members.push({
            user: req.user._id,
            role: invitation.role || "member",
            joinedAt: new Date(),
        });

        // Remove the accepted invitation
        workspace.invitations = workspace.invitations.filter((i) => i.token !== token);
        await workspace.save();

        const populatedWorkspace = await Workspace.findById(workspace._id)
            .populate("createdBy", "name email")
            .populate("members.user", "name email");

        return res.status(200).json({
            success: true,
            message: `Successfully joined ${workspace.name}`,
            workspace: populatedWorkspace,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while accepting invitation",
            error: error.message,
        });
    }
};

/**
 * Remove a member from a workspace
 * @route  DELETE /api/v1/workspaces/:workspaceId/members/:memberId
 * @access Private — Owner & Admin only
 */
const removeMember = async (req, res) => {
    try {
        const { workspaceId, memberId } = req.params;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ success: false, message: "Workspace not found" });
        }

        const requestingUserId = req.user._id.toString();
        const requesterRole = getWorkspaceUserRole(workspace, requestingUserId);

        if (!requesterRole || (requesterRole !== "owner" && requesterRole !== "admin")) {
            return res.status(403).json({
                success: false,
                message: "Access denied: Only Workspace Owners and Admins can remove members",
            });
        }

        // Locate member entry by subdoc _id or user._id
        const memberIndex = workspace.members.findIndex(
            (m) =>
                m._id?.toString() === memberId ||
                (m.user?._id || m.user)?.toString() === memberId
        );

        if (memberIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Member not found in this workspace",
            });
        }

        const targetMember = workspace.members[memberIndex];
        const targetUserId = (targetMember.user?._id || targetMember.user)?.toString();

        // Guard 1: Cannot remove workspace creator/owner
        if (workspace.createdBy.toString() === targetUserId || targetMember.role === "owner") {
            return res.status(403).json({
                success: false,
                message: "Cannot remove the workspace owner",
            });
        }

        // Guard 2: Admins cannot remove other admins (only owner can)
        if (requesterRole === "admin" && targetMember.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admins cannot remove other admins. Only the workspace owner can.",
            });
        }

        // Remove from members array
        workspace.members.splice(memberIndex, 1);
        await workspace.save();

        const updatedWorkspace = await Workspace.findById(workspace._id)
            .populate("createdBy", "name email")
            .populate("members.user", "name email")
            .populate("invitations.invitedBy", "name email");

        return res.status(200).json({
            success: true,
            message: "Member removed successfully",
            workspace: updatedWorkspace,
            members: updatedWorkspace.members,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while removing member",
            error: error.message,
        });
    }
};

/**
 * Update a member's role in a workspace
 * @route  PATCH /api/v1/workspaces/:workspaceId/members/:memberId/role
 * @access Private — Owner only
 */
const updateMemberRole = async (req, res) => {
    try {
        const { workspaceId, memberId } = req.params;
        const { role } = req.body;

        const validRoles = ["admin", "member", "viewer"];
        if (!role || !validRoles.includes(role.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Invalid role. Role must be admin, member, or viewer",
            });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ success: false, message: "Workspace not found" });
        }

        const requestingUserId = req.user._id.toString();
        const requesterRole = getWorkspaceUserRole(workspace, requestingUserId);

        // Only owner can change member roles
        if (requesterRole !== "owner") {
            return res.status(403).json({
                success: false,
                message: "Access denied: Only the workspace owner can modify member roles",
            });
        }

        const member = workspace.members.find(
            (m) =>
                m._id?.toString() === memberId ||
                (m.user?._id || m.user)?.toString() === memberId
        );

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Member not found in this workspace",
            });
        }

        // Cannot demote owner
        const targetUserId = (member.user?._id || member.user)?.toString();
        if (workspace.createdBy.toString() === targetUserId) {
            return res.status(403).json({
                success: false,
                message: "Cannot change the workspace owner's role",
            });
        }

        member.role = role.toLowerCase();
        await workspace.save();

        const updatedWorkspace = await Workspace.findById(workspace._id)
            .populate("createdBy", "name email")
            .populate("members.user", "name email")
            .populate("invitations.invitedBy", "name email");

        return res.status(200).json({
            success: true,
            message: `Member role updated to ${role.toLowerCase()}`,
            member,
            workspace: updatedWorkspace,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while updating member role",
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

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }

        const requestingUserId = req.user._id.toString();
        const isOwner = workspace.createdBy.toString() === requestingUserId;
        const isMember = workspace.members.some(
            (m) => (m.user?._id || m.user)?.toString() === requestingUserId
        );

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        const projects = await Project.find({ workspace: workspaceId });
        const projectIds = projects.map((p) => p._id);

        const totalProjects = projects.length;
        const activeProjects = projects.filter(
            (p) => p.status === "active" || p.status === "in_progress"
        ).length;

        const completedTasks = await Task.countDocuments({
            project: { $in: projectIds },
            status: "completed",
        });

        const [todoCount, inProgressCount, inReviewCount] = await Promise.all([
            Task.countDocuments({ project: { $in: projectIds }, status: "todo" }),
            Task.countDocuments({ project: { $in: projectIds }, status: "in_progress" }),
            Task.countDocuments({ project: { $in: projectIds }, status: "in_review" }),
        ]);

        const pendingTasks = todoCount + inProgressCount + inReviewCount;
        const totalTasks = completedTasks + pendingTasks;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const recentTasks = await Task.find({ project: { $in: projectIds } })
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate("project", "name")
            .populate("assignedTo", "name email");

        return res.status(200).json({
            success: true,
            data: {
                totalProjects,
                activeProjects,
                pendingTasks,
                completedTasks,
                totalTasks,
                completionRate,
                tasksByStatus: {
                    todo: todoCount,
                    in_progress: inProgressCount,
                    in_review: inReviewCount,
                    completed: completedTasks,
                },
                recentTasks,
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
    getUserWorkspaces,
    getWorkspaceById,
    createWorkspaceInvite,
    inviteMember: createWorkspaceInvite, // backward-compatible alias
    validateInviteToken,
    acceptInvite,
    removeMember,
    updateMemberRole,
    getWorkspaceDashboard,
};
