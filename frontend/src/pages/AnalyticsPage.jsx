import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
    BarChart3,
    CheckCircle2,
    Clock,
    AlertTriangle,
    TrendingUp,
    Users,
    FolderKanban,
    RefreshCw,
    Layers,
    Calendar,
    ArrowUpRight,
    CheckSquare,
    Sparkles,
    ShieldAlert,
    UserCheck,
} from "lucide-react";
import { fetchWorkspaceAnalytics, setTimeRange } from "../features/analyticsSlice";
import { fetchWorkspaces } from "../features/workspaceSlice";

const AnalyticsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { workspaceId: routeWorkspaceId } = useParams();

    const { currentWorkspace, workspaces } = useSelector((s) => s.workspace);
    const { data: analytics, loading, error, timeRange } = useSelector((s) => s.analytics);

    const [activeDonutSlice, setActiveDonutSlice] = useState(null);
    const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);

    // Active workspace resolution
    const activeWorkspaceId = routeWorkspaceId || currentWorkspace?._id;

    // Load initial workspaces if not present
    useEffect(() => {
        if (!currentWorkspace && workspaces.length === 0) {
            dispatch(fetchWorkspaces());
        }
    }, [dispatch, currentWorkspace, workspaces.length]);

    // Fetch analytics on workspace change or timeRange change
    useEffect(() => {
        if (activeWorkspaceId) {
            dispatch(fetchWorkspaceAnalytics({ workspaceId: activeWorkspaceId, days: timeRange }));
        }
    }, [dispatch, activeWorkspaceId, timeRange]);

    const handleRefresh = () => {
        if (activeWorkspaceId) {
            dispatch(fetchWorkspaceAnalytics({ workspaceId: activeWorkspaceId, days: timeRange }));
        }
    };

    const handleTimeRangeChange = (days) => {
        dispatch(setTimeRange(days));
    };

    // Metrics shorthand
    const metrics = analytics?.metrics || {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        inReviewTasks: 0,
        todoTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        activeMembers: 0,
    };

    const statusBreakdown = analytics?.statusBreakdown || [
        { key: "todo", label: "To Do", count: 0, color: "#94a3b8" },
        { key: "in_progress", label: "In Progress", count: 0, color: "#3b82f6" },
        { key: "in_review", label: "In Review", count: 0, color: "#f59e0b" },
        { key: "completed", label: "Done", count: 0, color: "#10b981" },
    ];

    const priorityDistribution = analytics?.priorityDistribution || [
        { key: "urgent", label: "Urgent", count: 0, color: "#ef4444" },
        { key: "high", label: "High", count: 0, color: "#f97316" },
        { key: "medium", label: "Medium", count: 0, color: "#3b82f6" },
        { key: "low", label: "Low", count: 0, color: "#71717a" },
    ];

    const memberWorkload = analytics?.memberWorkload || [];
    const velocityTrend = analytics?.velocityTrend || [];
    const upcomingDeadlines = analytics?.upcomingDeadlines || [];

    // SVG Donut calculations
    const donutData = useMemo(() => {
        const total = statusBreakdown.reduce((sum, item) => sum + item.count, 0);
        if (total === 0) {
            return {
                total: 0,
                segments: [],
            };
        }

        const size = 200;
        const radius = 70;
        const circumference = 2 * Math.PI * radius;
        let cumulativePercent = 0;

        const segments = statusBreakdown.map((item) => {
            const percent = item.count / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -(cumulativePercent * circumference);
            cumulativePercent += percent;

            return {
                ...item,
                percent: Math.round(percent * 100),
                strokeDasharray,
                strokeDashoffset,
            };
        });

        return { total, segments, radius, circumference, size };
    }, [statusBreakdown]);

    // Trend chart maximum calculation
    const trendMax = useMemo(() => {
        if (!velocityTrend.length) return 10;
        const maxVal = Math.max(
            ...velocityTrend.map((d) => Math.max(d.created || 0, d.completed || 0)),
            1
        );
        return Math.ceil(maxVal * 1.25);
    }, [velocityTrend]);

    const totalCreatedInRange = useMemo(
        () => velocityTrend.reduce((sum, d) => sum + (d.created || 0), 0),
        [velocityTrend]
    );

    const totalCompletedInRange = useMemo(
        () => velocityTrend.reduce((sum, d) => sum + (d.completed || 0), 0),
        [velocityTrend]
    );

    if (!activeWorkspaceId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                    <BarChart3 className="w-7 h-7" />
                </div>
                <div className="max-w-md">
                    <h2 className="text-xl font-bold text-foreground">No Workspace Selected</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select a workspace from the sidebar or create one to view aggregated analytics, performance trends, and team workloads.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics & Insights</h1>
                        {analytics?.workspace?.name && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border">
                                {analytics.workspace.name}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Workspace health, task resolution velocity, and member workload distribution.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Time Range Filter Toggle */}
                    <div className="inline-flex items-center p-1 bg-secondary rounded-xl border border-border text-xs font-medium text-muted-foreground">
                        {[
                            { label: "7 Days", value: 7 },
                            { label: "14 Days", value: 14 },
                            { label: "30 Days", value: 30 },
                        ].map((t) => (
                            <button
                                key={t.value}
                                onClick={() => handleTimeRangeChange(t.value)}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    timeRange === t.value
                                        ? "bg-card text-foreground font-semibold shadow-sm"
                                        : "hover:text-foreground"
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        title="Refresh analytics"
                        className="p-2 rounded-xl bg-card border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <span className="flex-1 font-medium">{error}</span>
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* 1. Quick KPI Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Tasks */}
                <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all shadow-sm group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Total Tasks
                        </span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground tracking-tight">
                            {metrics.totalTasks}
                        </span>
                        <span className="text-xs text-muted-foreground">in workspace</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground pt-3 border-t border-border/60">
                        <span className="font-semibold text-blue-500">{metrics.inProgressTasks}</span> in progress ·
                        <span className="font-semibold text-amber-500"> {metrics.inReviewTasks}</span> review
                    </div>
                </div>

                {/* Completion Rate */}
                <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-all shadow-sm group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Completion Rate
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground tracking-tight">
                            {metrics.completionRate}%
                        </span>
                        <span className="text-xs text-emerald-600 font-medium">resolved</span>
                    </div>
                    {/* Linear progress meter */}
                    <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
                                style={{ width: `${metrics.completionRate}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>{metrics.completedTasks} completed</span>
                            <span>{metrics.totalTasks - metrics.completedTasks} pending</span>
                        </div>
                    </div>
                </div>

                {/* Overdue Tasks */}
                <div className={`relative overflow-hidden p-5 rounded-2xl bg-card border transition-all shadow-sm group ${
                    metrics.overdueTasks > 0 ? "border-rose-500/30 bg-rose-500/[0.02]" : "border-border hover:border-amber-500/30"
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Overdue Tasks
                        </span>
                        <div className={`p-2 rounded-xl border group-hover:scale-110 transition-transform ${
                            metrics.overdueTasks > 0
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}>
                            {metrics.overdueTasks > 0 ? (
                                <AlertTriangle className="w-4 h-4" />
                            ) : (
                                <CheckSquare className="w-4 h-4" />
                            )}
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className={`text-3xl font-extrabold tracking-tight ${
                            metrics.overdueTasks > 0 ? "text-rose-500" : "text-foreground"
                        }`}>
                            {metrics.overdueTasks}
                        </span>
                        <span className="text-xs text-muted-foreground">missed deadline</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground pt-3 border-t border-border/60">
                        {metrics.overdueTasks > 0 ? (
                            <span className="text-rose-500 font-medium">Requires immediate action</span>
                        ) : (
                            <span className="text-emerald-600 font-medium">All tasks are on track</span>
                        )}
                    </div>
                </div>

                {/* Active Members & Projects */}
                <div className="relative overflow-hidden p-5 rounded-2xl bg-card border border-border hover:border-indigo-500/30 transition-all shadow-sm group">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Team & Projects
                        </span>
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground tracking-tight">
                            {metrics.activeMembers}
                        </span>
                        <span className="text-xs text-muted-foreground">active members</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/60">
                        <span>Projects:</span>
                        <span className="font-semibold text-foreground">
                            {metrics.activeProjects} active / {metrics.totalProjects} total
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Charts Row: Status Donut Chart & Priority Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Status Breakdown Donut Chart */}
                <div className="lg:col-span-6 p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-foreground">Status Breakdown</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Distribution of active and completed tasks
                                </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                                {metrics.totalTasks} Total
                            </span>
                        </div>

                        {donutData.total === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <CheckSquare className="w-8 h-8 mb-2 opacity-40" />
                                <p className="text-sm font-medium">No tasks found</p>
                                <p className="text-xs">Create tasks to view status analytics</p>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
                                {/* SVG Donut */}
                                <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                                        {/* Background Circle */}
                                        <circle
                                            cx="100"
                                            cy="100"
                                            r={donutData.radius}
                                            fill="transparent"
                                            stroke="currentColor"
                                            strokeWidth="22"
                                            className="text-secondary"
                                        />
                                        {/* Segments */}
                                        {donutData.segments.map((seg, idx) => (
                                            <circle
                                                key={seg.key}
                                                cx="100"
                                                cy="100"
                                                r={donutData.radius}
                                                fill="transparent"
                                                stroke={seg.color}
                                                strokeWidth={activeDonutSlice === seg.key ? 26 : 22}
                                                strokeDasharray={seg.strokeDasharray}
                                                strokeDashoffset={seg.strokeDashoffset}
                                                strokeLinecap="round"
                                                className="cursor-pointer transition-all duration-300"
                                                onMouseEnter={() => setActiveDonutSlice(seg.key)}
                                                onMouseLeave={() => setActiveDonutSlice(null)}
                                            />
                                        ))}
                                    </svg>

                                    {/* Centered Donut Label */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                        {activeDonutSlice ? (
                                            (() => {
                                                const active = statusBreakdown.find((s) => s.key === activeDonutSlice);
                                                return (
                                                    <>
                                                        <span className="text-2xl font-extrabold text-foreground">
                                                            {active?.count}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-muted-foreground uppercase">
                                                            {active?.label}
                                                        </span>
                                                    </>
                                                );
                                            })()
                                        ) : (
                                            <>
                                                <span className="text-2xl font-extrabold text-foreground">
                                                    {donutData.total}
                                                </span>
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">
                                                    Tasks
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Legend & List */}
                                <div className="space-y-3 flex-1 w-full max-w-xs">
                                    {statusBreakdown.map((item) => {
                                        const pct = donutData.total > 0 ? Math.round((item.count / donutData.total) * 100) : 0;
                                        return (
                                            <div
                                                key={item.key}
                                                onMouseEnter={() => setActiveDonutSlice(item.key)}
                                                onMouseLeave={() => setActiveDonutSlice(null)}
                                                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                                                    activeDonutSlice === item.key ? "bg-secondary" : "hover:bg-secondary/60"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span
                                                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <span className="text-sm font-medium text-foreground">
                                                        {item.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        {item.count}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground min-w-[32px] text-right">
                                                        {pct}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Priority Distribution */}
                <div className="lg:col-span-6 p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold text-foreground">Priority Distribution</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Severity balance across all active backlog items
                                </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                                4 Levels
                            </span>
                        </div>

                        {/* Proportional Segmented Bar */}
                        <div className="mt-4">
                            <div className="w-full h-3 rounded-full bg-secondary overflow-hidden flex shadow-inner">
                                {metrics.totalTasks > 0 ? (
                                    priorityDistribution.map((p) => {
                                        const widthPercent = (p.count / metrics.totalTasks) * 100;
                                        if (widthPercent === 0) return null;
                                        return (
                                            <div
                                                key={p.key}
                                                style={{ width: `${widthPercent}%`, backgroundColor: p.color }}
                                                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                                title={`${p.label}: ${p.count} tasks (${Math.round(widthPercent)}%)`}
                                            />
                                        );
                                    })
                                ) : (
                                    <div className="w-full h-full bg-secondary" />
                                )}
                            </div>
                        </div>

                        {/* Priority Breakdown Items */}
                        <div className="grid grid-cols-2 gap-3 mt-6">
                            {priorityDistribution.map((p) => {
                                const pct = metrics.totalTasks > 0 ? Math.round((p.count / metrics.totalTasks) * 100) : 0;
                                return (
                                    <div
                                        key={p.key}
                                        className="p-3.5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: p.color }}
                                                />
                                                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                                    {p.label}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground font-medium">{pct}%</span>
                                        </div>
                                        <div className="mt-2 flex items-baseline justify-between">
                                            <span className="text-2xl font-bold text-foreground">
                                                {p.count}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">tasks</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span>Urgent + High workload:</span>
                        <span className="font-semibold text-foreground">
                            {(priorityDistribution.find((p) => p.key === "urgent")?.count || 0) +
                                (priorityDistribution.find((p) => p.key === "high")?.count || 0)}{" "}
                            tasks
                        </span>
                    </div>
                </div>
            </div>

            {/* 3. Velocity / Activity Trend Chart */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <h3 className="text-base font-bold text-foreground">Resolution Velocity & Activity</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Created vs Completed tasks daily over the last {timeRange} days
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-blue-500 shadow-sm" />
                            <span className="text-muted-foreground">Created ({totalCreatedInRange})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm" />
                            <span className="text-muted-foreground">Completed ({totalCompletedInRange})</span>
                        </div>
                    </div>
                </div>

                {/* SVG Trend Bar/Column Visualization */}
                {velocityTrend.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                        No activity data available in this time range
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="h-56 w-full flex items-end gap-1.5 sm:gap-2 px-2 pt-6 pb-2 relative">
                            {/* Horizontal guide lines */}
                            <div className="absolute inset-x-0 top-6 border-b border-border/40 pointer-events-none" />
                            <div className="absolute inset-x-0 top-1/2 border-b border-border/40 pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-2 border-b border-border pointer-events-none" />

                            {velocityTrend.map((item, idx) => {
                                const createdHeight = (item.created / trendMax) * 100;
                                const completedHeight = (item.completed / trendMax) * 100;
                                const isHovered = hoveredTrendIndex === idx;

                                return (
                                    <div
                                        key={item.date}
                                        className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                                        onMouseEnter={() => setHoveredTrendIndex(idx)}
                                        onMouseLeave={() => setHoveredTrendIndex(null)}
                                    >
                                        {/* Hover Tooltip */}
                                        {isHovered && (
                                            <div className="absolute -top-14 z-30 px-3 py-1.5 rounded-lg bg-popover border border-border shadow-xl text-[11px] whitespace-nowrap pointer-events-none animate-fadeIn">
                                                <div className="font-bold text-foreground">{item.label}</div>
                                                <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                                                    <span className="text-blue-500 font-semibold">{item.created} created</span>
                                                    <span>·</span>
                                                    <span className="text-emerald-500 font-semibold">{item.completed} completed</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pair of Bars: Created (blue) & Completed (green) */}
                                        <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                                            {/* Created Bar */}
                                            <div
                                                style={{ height: `${Math.max(createdHeight, 4)}%` }}
                                                className={`w-1/2 max-w-[14px] rounded-t transition-all duration-300 ${
                                                    item.created > 0
                                                        ? isHovered
                                                            ? "bg-blue-400"
                                                            : "bg-blue-500/80 hover:bg-blue-500"
                                                        : "bg-secondary/40"
                                                }`}
                                            />
                                            {/* Completed Bar */}
                                            <div
                                                style={{ height: `${Math.max(completedHeight, 4)}%` }}
                                                className={`w-1/2 max-w-[14px] rounded-t transition-all duration-300 ${
                                                    item.completed > 0
                                                        ? isHovered
                                                            ? "bg-emerald-400"
                                                            : "bg-emerald-500/80 hover:bg-emerald-500"
                                                        : "bg-secondary/40"
                                                }`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* X-Axis Date Labels */}
                        <div className="flex justify-between px-2 text-[10px] sm:text-xs text-muted-foreground">
                            <span>{velocityTrend[0]?.label}</span>
                            {velocityTrend.length > 7 && (
                                <span>{velocityTrend[Math.floor(velocityTrend.length / 2)]?.label}</span>
                            )}
                            <span>{velocityTrend[velocityTrend.length - 1]?.label}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Bottom Row: Member Workload Balance & Upcoming Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Member Workload Balance */}
                <div className="lg:col-span-7 p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-primary" />
                                    <h3 className="text-base font-bold text-foreground">Member Workload Balance</h3>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Assigned vs resolved tasks across active team members
                                </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                                {memberWorkload.length} Members
                            </span>
                        </div>

                        {memberWorkload.length === 0 ? (
                            <div className="h-44 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Users className="w-8 h-8 mb-2 opacity-40" />
                                <p className="text-sm font-medium">No team workload recorded</p>
                                <p className="text-xs">Invite members and assign tasks to track workload</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {memberWorkload.slice(0, 6).map((member) => {
                                    const initials = (member.name || "Member")
                                        .split(" ")
                                        .map((w) => w[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase();

                                    return (
                                        <div key={member.userId || member.email} className="py-3.5 flex items-center justify-between gap-4">
                                            {/* Member Info */}
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                                    {member.avatar ? (
                                                        <img
                                                            src={member.avatar}
                                                            alt={member.name}
                                                            className="w-full h-full rounded-xl object-cover"
                                                        />
                                                    ) : (
                                                        initials
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                        {member.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {member.email || "No email"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Task metrics & Progress */}
                                            <div className="flex items-center gap-4 shrink-0">
                                                {/* Mini status bar */}
                                                <div className="hidden sm:block w-32">
                                                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                                                        <span>{member.completed}/{member.totalAssigned} done</span>
                                                        <span className="font-semibold">{member.completionRate}%</span>
                                                    </div>
                                                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className="bg-primary h-1.5 rounded-full transition-all duration-500"
                                                            style={{ width: `${member.completionRate}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Overdue alert badge if any */}
                                                {member.overdue > 0 && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                        {member.overdue} overdue
                                                    </span>
                                                )}

                                                {/* Total count badge */}
                                                <span className="px-2.5 py-1 rounded-lg bg-secondary text-xs font-bold text-foreground">
                                                    {member.totalAssigned} tasks
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Deadlines Widget */}
                <div className="lg:col-span-5 p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    <h3 className="text-base font-bold text-foreground">Upcoming Deadlines</h3>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Nearest unresolved task commitments
                                </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                Top 5
                            </span>
                        </div>

                        {upcomingDeadlines.length === 0 ? (
                            <div className="h-44 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <CheckCircle2 className="w-8 h-8 mb-2 opacity-40 text-emerald-500" />
                                <p className="text-sm font-medium">No urgent deadlines</p>
                                <p className="text-xs">All scheduled tasks have been fulfilled</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {upcomingDeadlines.map((task) => {
                                    const dueDateObj = new Date(task.dueDate);
                                    const formattedDate = dueDateObj.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    });

                                    const priorityColors = {
                                        urgent: "text-rose-500 bg-rose-500/10 border-rose-500/20",
                                        high: "text-orange-500 bg-orange-500/10 border-orange-500/20",
                                        medium: "text-blue-500 bg-blue-500/10 border-blue-500/20",
                                        low: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
                                    };

                                    return (
                                        <div
                                            key={task._id}
                                            className="p-3 rounded-xl border border-border bg-secondary/20 hover:bg-secondary/50 transition-all flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span
                                                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border ${
                                                            priorityColors[task.priority] || priorityColors.medium
                                                        }`}
                                                    >
                                                        {task.priority}
                                                    </span>
                                                    {task.project?.name && (
                                                        <span className="text-[11px] text-muted-foreground truncate">
                                                            in {task.project.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-semibold text-foreground truncate">
                                                    {task.title}
                                                </p>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-1 justify-end text-xs font-medium text-foreground">
                                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                                    <span>{formattedDate}</span>
                                                </div>
                                                <p
                                                    className={`text-[11px] font-medium mt-0.5 ${
                                                        task.isOverdue
                                                            ? "text-rose-500 font-bold"
                                                            : task.diffDays <= 2
                                                            ? "text-amber-500"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    {task.isOverdue
                                                        ? `Overdue by ${Math.abs(task.diffDays)}d`
                                                        : task.diffDays === 0
                                                        ? "Due today"
                                                        : task.diffDays === 1
                                                        ? "Due tomorrow"
                                                        : `In ${task.diffDays} days`}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
