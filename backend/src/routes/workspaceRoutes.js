const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { verifyWorkspaceRole } = require("../middleware/roleMiddleware");
const { createWorkspace, inviteMember, getWorkspaceDashboard } = require("../controllers/workspaceController");

const router = express.Router();

// POST /api/v1/workspaces - Create a new workspace
router.post("/", protect, createWorkspace);

// POST /api/v1/workspaces/invite - Invite a member (Owner & Admin only)
router.post("/invite", protect, verifyWorkspaceRole(["owner", "admin"]), inviteMember);

// GET /api/v1/workspaces/:workspaceId/dashboard - Workspace analytics (all members)
router.get("/:workspaceId/dashboard", protect, getWorkspaceDashboard);

module.exports = router;
