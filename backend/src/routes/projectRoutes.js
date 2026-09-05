const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { verifyWorkspaceRole } = require("../middleware/roleMiddleware");
const { createProject, getWorkspaceProjects } = require("../controllers/projectController");
const taskRoutes = require("./taskRoutes");

// mergeParams: true — makes :workspaceId from the parent router (app.js) available in req.params
const router = express.Router({ mergeParams: true });

// POST /api/v1/workspaces/:workspaceId/projects — Create a new project (Owner & Admin only)
router.post("/", protect, verifyWorkspaceRole(["owner", "admin"]), createProject);

// GET /api/v1/workspaces/:workspaceId/projects — Get all projects in workspace (all roles)
router.get("/", protect, verifyWorkspaceRole(["owner", "admin", "member"]), getWorkspaceProjects);

// Nest task routes — /api/v1/workspaces/:workspaceId/projects/:projectId/tasks
router.use("/:projectId/tasks", taskRoutes);

module.exports = router;
