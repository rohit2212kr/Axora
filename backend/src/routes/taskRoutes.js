const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
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
} = require("../controllers/taskController");

// mergeParams: true — inherits :workspaceId and :projectId from parent routers
const router = express.Router({ mergeParams: true });

// POST /api/v1/workspaces/:workspaceId/projects/:projectId/tasks
router.post("/", protect, createTask);

// GET  /api/v1/workspaces/:workspaceId/projects/:projectId/tasks
router.get("/", protect, getProjectTasks);

// GET  /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/kanban
// NOTE: must be declared BEFORE /:taskId to avoid 'kanban' being parsed as a taskId param
router.get("/kanban", protect, getKanbanTasks);

// ── Comments Endpoints ────────────────────────────────────────────────────────
// POST   .../tasks/:taskId/comments
router.post("/:taskId/comments", protect, addComment);

// DELETE .../tasks/:taskId/comments/:commentId
router.delete("/:taskId/comments/:commentId", protect, deleteComment);

// ── Labels Endpoints ──────────────────────────────────────────────────────────
// PUT    .../tasks/:taskId/labels
router.put("/:taskId/labels", protect, updateTaskLabels);

// ── Single Task CRUD & AI Breakdown ──────────────────────────────────────────
// GET    .../tasks/:taskId
router.get("/:taskId", protect, getTaskById);

// PUT    .../tasks/:taskId
router.put("/:taskId", protect, updateTask);

// DELETE .../tasks/:taskId
router.delete("/:taskId", protect, deleteTask);

// POST   .../tasks/:taskId/ai-breakdown
router.post("/:taskId/ai-breakdown", protect, generateTaskSubtasks);

module.exports = router;
