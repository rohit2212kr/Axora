const express = require("express");
const router = express.Router();
const { breakdownTask } = require("../controllers/ai.controller");
const { protect } = require("../middleware/authMiddleware");

// POST /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/breakdown
router.post(
    "/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/breakdown",
    protect,
    breakdownTask
);

// Alias routes for developer convenience
router.post(
    "/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/ai-breakdown",
    protect,
    breakdownTask
);
router.post(
    "/tasks/:taskId/breakdown",
    protect,
    breakdownTask
);

module.exports = router;
