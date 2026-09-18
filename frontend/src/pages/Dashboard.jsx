import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    FolderKanban,
    Activity,
    CheckCircle2,
    Clock,
    ArrowRight,
    Sparkles,
    Loader2
} from "lucide-react";
import { fetchDashboard, fetchProjects } from "../features/workspaceSlice";

const Dashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { currentWorkspace, dashboard, projects, loading } = useSelector((s) => s.workspace);
    const { user } = useSelector((s) => s.auth);

    useEffect(() => {
        if (currentWorkspace?._id) {
            dispatch(fetchDashboard(currentWorkspace._id));
            dispatch(fetchProjects(currentWorkspace._id));
        }
    }, [dispatch, currentWorkspace?._id]);

    // Fallbacks if data is still loading
    const totalProjects   = dashboard?.totalProjects   ?? projects.length ?? 0;
    const activeProjects  = dashboard?.activeProjects  ?? projects.filter((p) => p.status === "active" || p.status === "in_progress").length ?? 0;
    const completedTasks  = dashboard?.completedTasks  ?? 0;
    const pendingTasks    = dashboard?.pendingTasks    ?? 0;
    const totalTasks      = dashboard?.totalTasks      ?? (completedTasks + pendingTasks);
    const completionRate  = dashboard?.completionRate  ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
    const tasksByStatus   = dashboard?.tasksByStatus   ?? {
        todo: 0,
        in_progress: 0,
        in_review: 0,
        completed: completedTasks,
    };
    const recentTasks     = dashboard?.recentTasks     ?? [];

    const stats = [
        {
            title: "Total Projects",
            value: totalProjects,
            subtitle: "In workspace",
            icon: FolderKanban,
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
        },
        {
            title: "Active Projects",
            value: activeProjects,
            subtitle: "Currently in progress",
            icon: Activity,
            color: "text-primary",
            bg: "bg-primary/10 border-primary/20",
        },
        {
            title: "Completed Tasks",
            value: completedTasks,
            subtitle: "Successfully resolved",
            icon: CheckCircle2,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
        },
        {
            title: "Pending Tasks",
            value: pendingTasks,
            subtitle: "Waiting for completion",
            icon: Clock,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
        },
    ];

    if (!currentWorkspace) {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading workspace...</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                    <FolderKanban className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No Workspace Selected</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                    Select or create a workspace using the sidebar to view productivity metrics and team tasks.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        Welcome back, {user?.name || "Member"}!
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Here is what is happening across <strong className="text-foreground">{currentWorkspace.name}</strong> today.
                    </p>
                </div>

                <button
                    onClick={() => navigate("/projects")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-foreground text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all self-start sm:self-auto"
                >
                    <span>View Projects</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all flex flex-col justify-between"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">{item.title}</span>
                                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${item.bg}`}>
                                    <Icon className={`w-4 h-4 ${item.color}`} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-2xl font-bold text-foreground tracking-tight font-mono">{item.value}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Middle Section: Progress Bar & AI Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Task Completion Velocity */}
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Task Completion Velocity</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Real-time status tracking for active projects</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-primary bg-accent px-2.5 py-1 rounded-full border border-primary/20">
                                {completionRate}% Complete
                            </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 font-mono">
                                <span>{completedTasks} completed</span>
                                <span>{totalTasks} total tasks</span>
                            </div>
                            <div className="w-full bg-secondary h-3 rounded-full overflow-hidden flex">
                                <div
                                    className="bg-emerald-500 h-full transition-all duration-500"
                                    style={{ width: `${completionRate}%` }}
                                    title={`Completed: ${completedTasks}`}
                                />
                                <div
                                    className="bg-indigo-500 h-full transition-all duration-500"
                                    style={{ width: `${totalTasks > 0 ? (tasksByStatus.in_progress / totalTasks) * 100 : 0}%` }}
                                    title={`In Progress: ${tasksByStatus.in_progress}`}
                                />
                                <div
                                    className="bg-amber-500 h-full transition-all duration-500"
                                    style={{ width: `${totalTasks > 0 ? (tasksByStatus.in_review / totalTasks) * 100 : 0}%` }}
                                    title={`In Review: ${tasksByStatus.in_review}`}
                                />
                            </div>
                        </div>

                        {/* Status Breakdown Legend & Counts */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border">
                            <div className="bg-muted border border-border rounded-xl p-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                                    To Do
                                </div>
                                <span className="text-lg font-bold text-foreground">{tasksByStatus.todo || 0}</span>
                            </div>

                            <div className="bg-muted border border-border rounded-xl p-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                    In Progress
                                </div>
                                <span className="text-lg font-bold text-foreground">{tasksByStatus.in_progress || 0}</span>
                            </div>

                            <div className="bg-muted border border-border rounded-xl p-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                    In Review
                                </div>
                                <span className="text-lg font-bold text-foreground">{tasksByStatus.in_review || 0}</span>
                            </div>

                            <div className="bg-muted border border-border rounded-xl p-3">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Completed
                                </div>
                                <span className="text-lg font-bold text-foreground">{tasksByStatus.completed || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI & Quick Insights Card */}
                <div className="bg-gradient-to-br from-accent/40 via-slate-900 to-slate-900 border border-primary/20 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-amber-300" />
                            <h2 className="text-base font-bold text-foreground">AI Assistant Enabled</h2>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                            Axora uses Gemini AI to decompose complex tasks into actionable subtasks with estimated completion times.
                        </p>

                        <div className="mt-6 space-y-3">
                            <div className="p-3 bg-muted border border-border rounded-xl">
                                <span className="text-xs text-primary font-semibold uppercase tracking-wider block mb-1">
                                    Productivity Tip
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    Open any task on your Kanban board and tap <span className="text-foreground font-medium">✨ Break down with AI</span> to get structured subtask checklists instantly.
                                </p>
                            </div>

                            <div className="p-3 bg-muted border border-border rounded-xl">
                                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block mb-1">
                                    Workspace Status
                                </span>
                                <p className="text-xs text-muted-foreground">
                                    {projects.length} project{projects.length === 1 ? "" : "s"} tracked across {currentWorkspace.name}.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate("/projects")}
                        className="mt-6 w-full py-2.5 px-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <span>Open Project Kanban</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Recent Tasks List */}
            {recentTasks.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-base font-bold text-foreground mb-4">Recent Activity & Tasks</h2>
                    <div className="divide-y divide-slate-800/80">
                        {recentTasks.map((t) => (
                            <div key={t._id} className="py-3 flex items-center justify-between gap-4 flex-wrap">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        <span>Project: {t.project?.name || "General"}</span>
                                        {t.subtasks?.length > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="text-primary font-mono">
                                                    {t.subtasks.filter((s) => s.isCompleted).length}/{t.subtasks.length} subtasks
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs capitalize font-medium px-2.5 py-1 rounded-full bg-secondary text-foreground/80 border border-border">
                                    {t.status.replace("_", " ")}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
