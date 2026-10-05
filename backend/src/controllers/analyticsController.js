const mongoose = require("mongoose");
const Workspace = require("../models/Workspace");
const Task = require("../models/taskModel");
const Project = require("../models/project.model");

/**
 * Helper to format date as YYYY-MM-DD in UTC
 * @param {Date} date
 * @returns {string}
 */
const formatDateKey = (date) => {
    return date.toISOString().split("T")[0];
};

/**
 * Get comprehensive analytics for a workspace
 * @route  GET /api/v1/analytics/workspace/:workspaceId
 * @access Private — workspace members only
 */
const getWorkspaceAnalytics = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const daysQuery = req.query.days;
        const numDays = daysQuery === "all" ? 30 : Math.min(Math.max(parseInt(daysQuery, 10) || 14, 7), 90);

        if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
            return res.status(400).json({ success: false, message: "Invalid workspace ID" });
        }

        const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
        const workspace = await Workspace.findById(workspaceObjectId)
            .populate("createdBy", "name email avatar")
            .populate("members.user", "name email avatar");

        if (!workspace) {
            return res.status(404).json({ success: false, message: "Workspace not found" });
        }

        const requestingUserId = req.user._id.toString();
        const isOwner =
            (workspace.createdBy?._id || workspace.createdBy)?.toString() === requestingUserId;
        const isMember = workspace.members.some(
            (m) => (m.user?._id || m.user)?.toString() === requestingUserId
        );

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied: You are not a member of this workspace",
            });
        }

        const now = new Date();

        // ── 1. Task Metrics Summary ──────────────────────────────────────────
        const [totalTasks, completedTasks, inProgressTasks, inReviewTasks, todoTasks, overdueTasks] =
            await Promise.all([
                Task.countDocuments({ workspace: workspaceObjectId }),
                Task.countDocuments({
                    workspace: workspaceObjectId,
                    status: { $in: ["completed", "done"] },
                }),
                Task.countDocuments({
                    workspace: workspaceObjectId,
                    status: { $in: ["in_progress", "in-progress"] },
                }),
                Task.countDocuments({
                    workspace: workspaceObjectId,
                    status: { $in: ["in_review", "in-review"] },
                }),
                Task.countDocuments({
                    workspace: workspaceObjectId,
                    status: "todo",
                }),
                Task.countDocuments({
                    workspace: workspaceObjectId,
                    status: { $nin: ["completed", "done"] },
                    dueDate: { $lt: now },
                }),
            ]);

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // ── 2. Status Breakdown ──────────────────────────────────────────────
        const statusAgg = await Task.aggregate([
            { $match: { workspace: workspaceObjectId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const statusCounts = {
            todo: 0,
            in_progress: 0,
            in_review: 0,
            completed: 0,
        };

        statusAgg.forEach((item) => {
            const raw = item._id ? item._id.replace("-", "_") : "todo";
            const normalized = raw === "done" ? "completed" : raw;
            if (statusCounts[normalized] !== undefined) {
                statusCounts[normalized] += item.count;
            } else {
                statusCounts.todo += item.count;
            }
        });

        const statusBreakdown = [
            { key: "todo", label: "To Do", count: statusCounts.todo, color: "#94a3b8" },
            { key: "in_progress", label: "In Progress", count: statusCounts.in_progress, color: "#3b82f6" },
            { key: "in_review", label: "In Review", count: statusCounts.in_review, color: "#f59e0b" },
            { key: "completed", label: "Done", count: statusCounts.completed, color: "#10b981" },
        ];

        // ── 3. Priority Distribution ─────────────────────────────────────────
        const priorityAgg = await Task.aggregate([
            { $match: { workspace: workspaceObjectId } },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]);

        const priorityCounts = {
            urgent: 0,
            high: 0,
            medium: 0,
            low: 0,
        };

        priorityAgg.forEach((item) => {
            const p = item._id ? item._id.toLowerCase() : "medium";
            if (priorityCounts[p] !== undefined) {
                priorityCounts[p] += item.count;
            } else {
                priorityCounts.medium += item.count;
            }
        });

        const priorityDistribution = [
            { key: "urgent", label: "Urgent", count: priorityCounts.urgent, color: "#ef4444" },
            { key: "high", label: "High", count: priorityCounts.high, color: "#f97316" },
            { key: "medium", label: "Medium", count: priorityCounts.medium, color: "#3b82f6" },
            { key: "low", label: "Low", count: priorityCounts.low, color: "#71717a" },
        ];

        // ── 4. Member Workload Balance ───────────────────────────────────────
        const memberWorkloadAgg = await Task.aggregate([
            { $match: { workspace: workspaceObjectId } },
            {
                $group: {
                    _id: { $ifNull: ["$assignedTo", "$assignee"] },
                    totalAssigned: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $in: ["$status", ["completed", "done"]] }, 1, 0] },
                    },
                    inProgress: {
                        $sum: { $cond: [{ $in: ["$status", ["in_progress", "in-progress"]] }, 1, 0] },
                    },
                    overdue: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $nin: ["$status", ["completed", "done"]] },
                                        { $lt: ["$dueDate", now] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    userId: "$_id",
                    name: { $ifNull: ["$user.name", "Unassigned"] },
                    email: { $ifNull: ["$user.email", ""] },
                    avatar: { $ifNull: ["$user.avatar", null] },
                    totalAssigned: 1,
                    completed: 1,
                    inProgress: 1,
                    overdue: 1,
                },
            },
            { $sort: { totalAssigned: -1 } },
        ]);

        // Merge workspace members who might have 0 tasks assigned
        const workloadMap = new Map();
        memberWorkloadAgg.forEach((w) => {
            const key = w.userId ? w.userId.toString() : "unassigned";
            workloadMap.set(key, {
                userId: w.userId,
                name: w.name,
                email: w.email,
                avatar: w.avatar,
                totalAssigned: w.totalAssigned,
                completed: w.completed,
                inProgress: w.inProgress,
                overdue: w.overdue,
                completionRate: w.totalAssigned > 0 ? Math.round((w.completed / w.totalAssigned) * 100) : 0,
            });
        });

        // Add creator if not present
        if (workspace.createdBy) {
            const cId = (workspace.createdBy._id || workspace.createdBy).toString();
            if (!workloadMap.has(cId)) {
                workloadMap.set(cId, {
                    userId: workspace.createdBy._id || workspace.createdBy,
                    name: workspace.createdBy.name || "Owner",
                    email: workspace.createdBy.email || "",
                    avatar: workspace.createdBy.avatar || null,
                    totalAssigned: 0,
                    completed: 0,
                    inProgress: 0,
                    overdue: 0,
                    completionRate: 0,
                });
            }
        }

        // Add 0-task members
        workspace.members.forEach((m) => {
            const u = m.user;
            if (u && (u._id || u)) {
                const uid = (u._id || u).toString();
                if (!workloadMap.has(uid)) {
                    workloadMap.set(uid, {
                        userId: u._id || u,
                        name: u.name || "Member",
                        email: u.email || "",
                        avatar: u.avatar || null,
                        totalAssigned: 0,
                        completed: 0,
                        inProgress: 0,
                        overdue: 0,
                        completionRate: 0,
                    });
                }
            }
        });

        const memberWorkload = Array.from(workloadMap.values()).sort(
            (a, b) => b.totalAssigned - a.totalAssigned
        );

        // ── 5. Velocity / Activity Trend (Created vs Completed over time) ───
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (numDays - 1));
        startDate.setHours(0, 0, 0, 0);

        const [createdTrendAgg, completedTrendAgg] = await Promise.all([
            Task.aggregate([
                {
                    $match: {
                        workspace: workspaceObjectId,
                        createdAt: { $gte: startDate },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        created: { $sum: 1 },
                    },
                },
            ]),
            Task.aggregate([
                {
                    $match: {
                        workspace: workspaceObjectId,
                        status: { $in: ["completed", "done"] },
                        updatedAt: { $gte: startDate },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                        completed: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const createdMap = new Map();
        createdTrendAgg.forEach((item) => createdMap.set(item._id, item.count || item.created));

        const completedMap = new Map();
        completedTrendAgg.forEach((item) => completedMap.set(item._id, item.count || item.completed));

        const velocityTrend = [];
        for (let i = 0; i < numDays; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = formatDateKey(d);
            const displayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

            velocityTrend.push({
                date: dateStr,
                label: displayLabel,
                created: createdMap.get(dateStr) || 0,
                completed: completedMap.get(dateStr) || 0,
            });
        }

        // ── 6. Upcoming Deadlines (Top 5 nearest pending tasks) ─────────────
        const upcomingDeadlines = await Task.find({
            workspace: workspaceObjectId,
            status: { $nin: ["completed", "done"] },
            dueDate: { $exists: true, $ne: null },
        })
            .sort({ dueDate: 1 })
            .limit(5)
            .populate("project", "name")
            .populate("assignedTo", "name email avatar");

        const formattedDeadlines = upcomingDeadlines.map((t) => {
            const diffMs = new Date(t.dueDate).getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const isOverdue = diffMs < 0;

            return {
                _id: t._id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate,
                diffDays,
                isOverdue,
                project: t.project ? { _id: t.project._id, name: t.project.name } : null,
                assignedTo: t.assignedTo
                    ? { _id: t.assignedTo._id, name: t.assignedTo.name, avatar: t.assignedTo.avatar }
                    : null,
            };
        });

        // ── 7. Project Metrics Overview ──────────────────────────────────────
        const [totalProjects, activeProjects, completedProjects] = await Promise.all([
            Project.countDocuments({ workspace: workspaceObjectId }),
            Project.countDocuments({
                workspace: workspaceObjectId,
                status: { $in: ["active", "in_progress", "planning"] },
            }),
            Project.countDocuments({ workspace: workspaceObjectId, status: "completed" }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                workspace: {
                    _id: workspace._id,
                    name: workspace.name,
                    totalMembers: workspace.members.length,
                },
                metrics: {
                    totalTasks,
                    completedTasks,
                    inProgressTasks,
                    inReviewTasks,
                    todoTasks,
                    overdueTasks,
                    completionRate,
                    totalProjects,
                    activeProjects,
                    completedProjects,
                    activeMembers: workspace.members.length,
                },
                statusBreakdown,
                priorityDistribution,
                memberWorkload,
                velocityTrend,
                upcomingDeadlines: formattedDeadlines,
                timeRangeDays: numDays,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error while generating workspace analytics",
            error: error.message,
        });
    }
};

module.exports = {
    getWorkspaceAnalytics,
};
