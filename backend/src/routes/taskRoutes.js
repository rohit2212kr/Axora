const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createTask, getProjectTasks, updateTask, deleteTask, getKanbanTasks, generateTaskSubtasks } = require("../controllers/taskController");

// mergeParams: true — inherits :workspaceId and :projectId from parent routers
const router = express.Router({ mergeParams: true });

// POST /api/v1/workspaces/:workspaceId/projects/:projectId/tasks
router.post("/", protect, createTask);

// GET  /api/v1/workspaces/:workspaceId/projects/:projectId/tasks
router.get("/", protect, getProjectTasks);

// GET  /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/kanban
// NOTE: must be declared BEFORE /:taskId to avoid 'kanban' being parsed as a taskId param
router.get("/kanban", protect, getKanbanTasks);

// PUT  /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
router.put("/:taskId", protect, updateTask);

// DELETE /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId
router.delete("/:taskId", protect, deleteTask);

// POST /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/ai-breakdown
router.post("/:taskId/ai-breakdown", protect, generateTaskSubtasks);

module.exports = router;
