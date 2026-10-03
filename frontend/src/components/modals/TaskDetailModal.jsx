import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    X,
    Sparkles,
    Calendar,
    Clock,
    CheckCircle2,
    Circle,
    AlertCircle,
    Loader2,
    ListTodo,
    Tag,
    MessageSquare,
    History,
    Plus,
    Trash2,
    Send,
    User as UserIcon,
} from "lucide-react";
import {
    breakdownTaskWithAI,
    toggleSubtask,
    updateTaskStatus,
    clearAiError,
    addComment,
    deleteComment,
    updateTaskLabels,
} from "../../features/taskSlice";

const PRIORITY_BADGES = {
    low:    "text-muted-foreground bg-secondary border-border",
    medium: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    high:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
    urgent: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const STATUS_OPTIONS = [
    { value: "todo",        label: "To Do"       },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review",   label: "In Review"   },
    { value: "completed",   label: "Completed"   },
];

const PRESET_LABELS = [
    { name: "Bug", color: "#ef4444" },
    { name: "Feature", color: "#3b82f6" },
    { name: "Design", color: "#8b5cf6" },
    { name: "Improvement", color: "#10b981" },
    { name: "Documentation", color: "#f59e0b" },
    { name: "Security", color: "#ec4899" },
];

const PRESET_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#10b981",
    "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
    "#ec4899", "#71717a",
];

const ACTION_COLORS = {
    TASK_CREATED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    STATUS_CHANGED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    PRIORITY_CHANGED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    LABELS_UPDATED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    COMMENT_ADDED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    COMMENT_DELETED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    AI_SUBTASKS_GENERATED: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
    ASSIGNEE_CHANGED: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    DUE_DATE_CHANGED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const formatTimestamp = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const TaskDetailModal = ({ isOpen, onClose, taskId, workspaceId, projectId }) => {
    const dispatch = useDispatch();

    const task = useSelector((s) => s.task.tasks.find((t) => t._id === taskId));
    const { aiLoading, aiGeneratingTaskId, aiError, commentLoading, labelsLoading } = useSelector((s) => s.task);
    const { user: currentUser } = useSelector((s) => s.auth);
    const { currentWorkspace } = useSelector((s) => s.workspace);

    const [activeTab, setActiveTab] = useState("subtasks"); // "subtasks" | "comments" | "activity"
    const [commentText, setCommentText] = useState("");
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [customLabelName, setCustomLabelName] = useState("");
    const [customLabelColor, setCustomLabelColor] = useState("#6366f1");

    if (!isOpen || !task) return null;

    const isThisTaskGenerating = aiLoading && aiGeneratingTaskId === task._id;
    const subtasks = task.subtasks || [];
    const comments = task.comments || [];
    const activity = task.activity || [];
    const labels = task.labels || [];

    const completedCount = subtasks.filter((st) => st.isCompleted).length;
    const totalCount = subtasks.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const isUserAdminOrOwner =
        currentWorkspace?.createdBy === currentUser?._id ||
        currentWorkspace?.members?.some(
            (m) => (m.user?._id || m.user) === currentUser?._id && (m.role === "admin" || m.role === "owner")
        );

    const handleAIBreakdown = () => {
        dispatch(clearAiError());
        dispatch(breakdownTaskWithAI({ workspaceId, projectId, taskId: task._id }));
    };

    const handleToggleSubtask = (subtask) => {
        dispatch(
            toggleSubtask({
                workspaceId,
                projectId,
                taskId: task._id,
                subtaskId: subtask._id,
                isCompleted: !subtask.isCompleted,
            })
        );
    };

    const handleStatusChange = (e) => {
        dispatch(
            updateTaskStatus({
                workspaceId,
                projectId,
                taskId: task._id,
                status: e.target.value,
            })
        );
    };

    const handleAddComment = (e) => {
        e?.preventDefault();
        if (!commentText.trim() || commentLoading) return;

        dispatch(
            addComment({
                workspaceId,
                projectId,
                taskId: task._id,
                text: commentText.trim(),
            })
        );
        setCommentText("");
    };

    const handleDeleteComment = (commentId) => {
        dispatch(
            deleteComment({
                workspaceId,
                projectId,
                taskId: task._id,
                commentId,
            })
        );
    };

    const handleAddPresetLabel = (preset) => {
        if (labels.some((l) => l.name.toLowerCase() === preset.name.toLowerCase())) {
            return;
        }
        const updated = [...labels, { name: preset.name, color: preset.color }];
        dispatch(updateTaskLabels({ workspaceId, projectId, taskId: task._id, labels: updated }));
    };

    const handleAddCustomLabel = (e) => {
        e?.preventDefault();
        if (!customLabelName.trim()) return;
        if (labels.some((l) => l.name.toLowerCase() === customLabelName.trim().toLowerCase())) {
            setCustomLabelName("");
            return;
        }
        const updated = [...labels, { name: customLabelName.trim(), color: customLabelColor }];
        dispatch(updateTaskLabels({ workspaceId, projectId, taskId: task._id, labels: updated }));
        setCustomLabelName("");
        setShowLabelPicker(false);
    };

    const handleRemoveLabel = (labelName) => {
        const updated = labels.filter((l) => l.name !== labelName);
        dispatch(updateTaskLabels({ workspaceId, projectId, taskId: task._id, labels: updated }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div
                className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-start justify-between p-6 border-b border-border gap-4 bg-card">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium}`}>
                                {task.priority}
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No due date"}
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-foreground leading-tight">
                            {task.title}
                        </h2>

                        {task.description && (
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                {task.description}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={task.status}
                            onChange={handleStatusChange}
                            className="bg-secondary border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 font-medium outline-none cursor-pointer hover:border-zinc-500 transition-colors focus:ring-1 focus:ring-ring"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>

                        <button
                            onClick={onClose}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Labels Bar */}
                <div className="px-6 py-3 border-b border-border bg-muted/30 flex items-center gap-2 flex-wrap text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground font-medium shrink-0">
                        <Tag className="w-3.5 h-3.5" /> Labels:
                    </span>

                    {labels.map((lbl, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold border text-[11px] group transition-all"
                            style={{
                                backgroundColor: `${lbl.color}18`,
                                color: lbl.color,
                                borderColor: `${lbl.color}40`,
                            }}
                        >
                            {lbl.name}
                            <button
                                onClick={() => handleRemoveLabel(lbl.name)}
                                className="opacity-60 hover:opacity-100 hover:text-white transition-opacity ml-0.5"
                                title="Remove label"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}

                    {/* Add label toggle button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLabelPicker(!showLabelPicker)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-border hover:border-primary text-muted-foreground hover:text-foreground transition-colors font-medium text-[11px]"
                        >
                            <Plus className="w-3 h-3" /> Add Label
                        </button>

                        {/* Label Picker Popover */}
                        {showLabelPicker && (
                            <div className="absolute left-0 top-full mt-2 w-72 bg-card border border-border shadow-xl rounded-xl p-3 z-30 flex flex-col gap-3">
                                <div>
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        Preset Labels
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PRESET_LABELS.map((preset) => {
                                            const active = labels.some((l) => l.name.toLowerCase() === preset.name.toLowerCase());
                                            return (
                                                <button
                                                    key={preset.name}
                                                    type="button"
                                                    onClick={() => handleAddPresetLabel(preset)}
                                                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
                                                        active ? "opacity-40 cursor-not-allowed" : "hover:scale-105"
                                                    }`}
                                                    style={{
                                                        backgroundColor: `${preset.color}20`,
                                                        color: preset.color,
                                                        borderColor: `${preset.color}50`,
                                                    }}
                                                    disabled={active}
                                                >
                                                    {preset.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="border-t border-border pt-2.5">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        Custom Label
                                    </p>
                                    <form onSubmit={handleAddCustomLabel} className="flex flex-col gap-2">
                                        <input
                                            type="text"
                                            placeholder="Label name..."
                                            value={customLabelName}
                                            onChange={(e) => setCustomLabelName(e.target.value)}
                                            className="w-full bg-secondary border border-border rounded-lg px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                                        />
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {PRESET_COLORS.map((col) => (
                                                <button
                                                    key={col}
                                                    type="button"
                                                    onClick={() => setCustomLabelColor(col)}
                                                    className={`w-4 h-4 rounded-full border transition-transform ${
                                                        customLabelColor === col ? "scale-125 border-white ring-1 ring-primary" : "border-transparent hover:scale-110"
                                                    }`}
                                                    style={{ backgroundColor: col }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-end gap-2 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowLabelPicker(false)}
                                                className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!customLabelName.trim() || labelsLoading}
                                                className="px-2.5 py-1 text-xs bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section Navigation Tabs */}
                <div className="flex border-b border-border bg-muted/20 px-6 gap-6 text-sm font-medium">
                    <button
                        onClick={() => setActiveTab("subtasks")}
                        className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
                            activeTab === "subtasks"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <ListTodo className="w-4 h-4" />
                        <span>Subtasks</span>
                        <span className="text-xs px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground font-mono">
                            {completedCount}/{totalCount}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab("comments")}
                        className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
                            activeTab === "comments"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Comments</span>
                        <span className="text-xs px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground font-mono">
                            {comments.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab("activity")}
                        className={`flex items-center gap-2 py-3 border-b-2 transition-colors ${
                            activeTab === "activity"
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <History className="w-4 h-4" />
                        <span>Activity Log</span>
                        <span className="text-xs px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground font-mono">
                            {activity.length}
                        </span>
                    </button>
                </div>

                {/* Modal Body / Tab Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">

                    {/* ─── TAB 1: Subtasks ─── */}
                    {activeTab === "subtasks" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <ListTodo className="w-4 h-4 text-primary" />
                                    Subtasks Breakdown
                                </h3>

                                <button
                                    onClick={handleAIBreakdown}
                                    disabled={isThisTaskGenerating}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-medium transition-all disabled:opacity-50"
                                >
                                    {isThisTaskGenerating ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Breaking down with Gemini...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                            <span>✨ Break down with AI</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Error Alert */}
                            {aiError && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <p className="flex-1">{aiError}</p>
                                    <button
                                        onClick={() => dispatch(clearAiError())}
                                        className="text-muted-foreground hover:text-foreground text-xs underline"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}

                            {/* Progress bar if subtasks exist */}
                            {totalCount > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                        <span>Progress</span>
                                        <span className="text-primary">{progressPercent}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300 rounded-full"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Active Generating Shimmer State */}
                            {isThisTaskGenerating && (
                                <div className="space-y-2.5 p-4 bg-muted border border-primary/30 rounded-xl animate-pulse">
                                    <div className="flex items-center gap-2 text-xs text-primary font-medium mb-3">
                                        <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
                                        <span>Gemini AI is analyzing requirements and estimating subtasks...</span>
                                    </div>
                                    <div className="h-10 bg-secondary rounded-lg w-full" />
                                    <div className="h-10 bg-secondary rounded-lg w-11/12" />
                                    <div className="h-10 bg-secondary rounded-lg w-4/5" />
                                </div>
                            )}

                            {/* Subtasks List */}
                            {!isThisTaskGenerating && subtasks.length > 0 && (
                                <div className="space-y-2">
                                    {subtasks.map((st) => (
                                        <div
                                            key={st._id}
                                            onClick={() => handleToggleSubtask(st)}
                                            className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                                st.isCompleted
                                                    ? "bg-muted/40 border-border opacity-60"
                                                    : "bg-muted border-border hover:border-zinc-500"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <button
                                                    type="button"
                                                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                                                >
                                                    {st.isCompleted ? (
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                                                    )}
                                                </button>
                                                <span
                                                    className={`text-sm font-medium leading-tight truncate ${
                                                        st.isCompleted
                                                            ? "line-through text-muted-foreground"
                                                            : "text-foreground"
                                                    }`}
                                                >
                                                    {st.title}
                                                </span>
                                            </div>

                                            {st.estimatedMinutes && (
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-secondary border border-border px-2 py-0.5 rounded-md shrink-0">
                                                    <Clock className="w-3 h-3" />
                                                    ~{st.estimatedMinutes}m
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty state */}
                            {!isThisTaskGenerating && subtasks.length === 0 && (
                                <div className="text-center py-8 px-4 bg-muted/40 border border-dashed border-border rounded-xl">
                                    <Sparkles className="w-8 h-8 text-primary/50 mx-auto mb-2" />
                                    <p className="text-sm text-foreground font-medium">No subtasks generated yet</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                        Click <strong className="text-primary">✨ Break down with AI</strong> above to let Google Gemini decompose this task into structured steps with time estimates.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── TAB 2: Comments ─── */}
                    {activeTab === "comments" && (
                        <div className="space-y-5">
                            {/* Comment Form */}
                            <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                                <div className="relative">
                                    <textarea
                                        rows={3}
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                                handleAddComment();
                                            }
                                        }}
                                        placeholder="Write a comment... (Ctrl+Enter to post)"
                                        className="w-full bg-secondary border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-1 focus:ring-ring transition-all"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-muted-foreground">
                                        Tip: Press <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono">Ctrl+Enter</kbd> to submit
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={!commentText.trim() || commentLoading}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
                                    >
                                        {commentLoading ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Send className="w-3.5 h-3.5" />
                                        )}
                                        <span>Comment</span>
                                    </button>
                                </div>
                            </form>

                            {/* Comments List */}
                            <div className="space-y-3 pt-2">
                                {comments.length === 0 ? (
                                    <div className="text-center py-10 px-4 bg-muted/30 border border-dashed border-border rounded-xl">
                                        <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-foreground">No comments yet</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Start a discussion or leave notes on this task.
                                        </p>
                                    </div>
                                ) : (
                                    [...comments]
                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                        .map((c) => {
                                            const commentUser = c.user;
                                            const authorName = commentUser?.name || "Workspace Member";
                                            const canDelete =
                                                (commentUser?._id || commentUser) === currentUser?._id ||
                                                isUserAdminOrOwner;

                                            return (
                                                <div
                                                    key={c._id}
                                                    className="p-3.5 rounded-xl bg-muted/60 border border-border hover:border-zinc-500/60 transition-colors flex gap-3 group"
                                                >
                                                    {/* Avatar */}
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                                                        {authorName.charAt(0)}
                                                    </div>

                                                    {/* Body */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-semibold text-foreground">
                                                                    {authorName}
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    {formatTimestamp(c.createdAt)}
                                                                </span>
                                                            </div>

                                                            {canDelete && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(c._id)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                                                                    title="Delete comment"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                                            {c.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── TAB 3: Activity Log ─── */}
                    {activeTab === "activity" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <History className="w-4 h-4 text-primary" />
                                    Audit Activity Log
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                    {activity.length} event{activity.length === 1 ? "" : "s"} recorded
                                </span>
                            </div>

                            {activity.length === 0 ? (
                                <div className="text-center py-10 px-4 bg-muted/30 border border-dashed border-border rounded-xl">
                                    <History className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-foreground">No activity recorded yet</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Task modifications and status changes will automatically appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                                    {[...activity]
                                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                        .map((act) => {
                                            const actor = act.user;
                                            const actorName = actor?.name || "User";
                                            const badgeStyle = ACTION_COLORS[act.action] || "bg-secondary text-muted-foreground border-border";

                                            return (
                                                <div key={act._id} className="relative flex items-start gap-3 text-xs">
                                                    {/* Timeline node */}
                                                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card" />

                                                    <div className="flex-1 bg-muted/40 border border-border rounded-lg p-2.5">
                                                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-semibold text-foreground">
                                                                    {actorName}
                                                                </span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${badgeStyle}`}>
                                                                    {act.action?.replace("_", " ")}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] text-muted-foreground">
                                                                {formatTimestamp(act.timestamp)}
                                                            </span>
                                                        </div>

                                                        <p className="text-muted-foreground text-xs leading-normal">
                                                            {typeof act.details === "string"
                                                                ? act.details
                                                                : JSON.stringify(act.details)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-border bg-muted/40 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
