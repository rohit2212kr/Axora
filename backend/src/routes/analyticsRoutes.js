const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getWorkspaceAnalytics } = require("../controllers/analyticsController");

const router = express.Router();

/**
 * @route   GET /api/v1/analytics/workspace/:workspaceId
 * @route   GET /api/v1/analytics/:workspaceId
 * @desc    Get aggregated task metrics, status distribution, workload and velocity trends for a workspace
 * @access  Private (Workspace members only)
 */
router.get("/workspace/:workspaceId", protect, getWorkspaceAnalytics);
router.get("/:workspaceId", protect, getWorkspaceAnalytics);

module.exports = router;
