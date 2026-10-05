const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { verifyWorkspaceRole } = require("../middleware/roleMiddleware");
const {
    createWorkspace,
    getUserWorkspaces,
    getWorkspaceById,
    createWorkspaceInvite,
    validateInviteToken,
    acceptInvite,
    removeMember,
    updateMemberRole,
    getWorkspaceDashboard,
} = require("../controllers/workspaceController");

const router = express.Router();

// ─── Workspace Collection Routes ─────────────────────────────────────────────
// GET /api/v1/workspaces - Fetch all workspaces user belongs to
router.get("/", protect, getUserWorkspaces);

// POST /api/v1/workspaces - Create a new workspace
router.post("/", protect, createWorkspace);

// ─── Public & Token Invitation Routes (Must precede /:workspaceId) ───────────
// GET /api/v1/workspaces/invite/:token - Validate invitation token (Public)
router.get("/invite/:token", validateInviteToken);

// POST /api/v1/workspaces/invite/:token/accept - Accept invitation (Protected)
router.post("/invite/:token/accept", protect, acceptInvite);

// ─── Workspace Specific Routes ───────────────────────────────────────────────
// POST /api/v1/workspaces/invite - Legacy/fallback invite endpoint
router.post("/invite", protect, verifyWorkspaceRole(["owner", "admin"]), createWorkspaceInvite);

// POST /api/v1/workspaces/:workspaceId/invites - Send workspace invite (Owner/Admin)
router.post("/:workspaceId/invites", protect, verifyWorkspaceRole(["owner", "admin"]), createWorkspaceInvite);

// GET /api/v1/workspaces/:workspaceId - Workspace details, members, invites
router.get("/:workspaceId", protect, getWorkspaceById);

// DELETE /api/v1/workspaces/:workspaceId/members/:memberId - Remove member (Owner/Admin)
router.delete("/:workspaceId/members/:memberId", protect, verifyWorkspaceRole(["owner", "admin"]), removeMember);

// PATCH /api/v1/workspaces/:workspaceId/members/:memberId/role - Update member role (Owner only)
router.patch("/:workspaceId/members/:memberId/role", protect, verifyWorkspaceRole(["owner"]), updateMemberRole);

// GET /api/v1/workspaces/:workspaceId/dashboard - Workspace analytics
router.get("/:workspaceId/dashboard", protect, getWorkspaceDashboard);

module.exports = router;
