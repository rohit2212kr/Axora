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
    ListTodo
} from "lucide-react";
import {
    breakdownTaskWithAI,
    toggleSubtask,
    updateTaskStatus,
    clearAiError
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

const TaskDetailModal = ({ isOpen, onClose, taskId, workspaceId, projectId }) => {
    const dispatch = useDispatch();

    const task = useSelector((s) => s.task.tasks.find((t) => t._id === taskId));
    const { aiLoading, aiGeneratingTaskId, aiError } = useSelector((s) => s.task);

    if (!isOpen || !task) return null;

    const isThisTaskGenerating = aiLoading && aiGeneratingTaskId === task._id;
    const subtasks = task.subtasks || [];
    const completedCount = subtasks.filter((st) => st.isCompleted).length;
    const totalCount = subtasks.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div
                className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-start justify-between p-6 border-b border-border gap-4">
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
                        <h2 className="text-xl font-bold text-foreground leading-snug">
                            {task.title}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={task.status}
                            onChange={handleStatusChange}
                            className="bg-secondary border border-border text-foreground text-xs rounded-lg px-3 py-2 outline-none cursor-pointer hover:border-zinc-500 transition-colors focus:ring-2 focus:ring-ring font-medium"
                        >
                            {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Description */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Description
                        </h3>
                        <div className="bg-muted border border-border rounded-xl p-4 text-sm text-foreground/80 leading-relaxed min-h-[4rem]">
                            {task.description ? task.description : <span className="text-muted-foreground italic">No description provided for this task.</span>}
                        </div>
                    </div>

                    {/* AI Breakdown & Subtasks Section */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <ListTodo className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-bold text-foreground">
                                    Subtasks
                                    {totalCount > 0 && (
                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                            ({completedCount}/{totalCount} completed)
                                        </span>
                                    )}
                                </h3>
                            </div>

                            {/* AI Breakdown Button */}
                            <button
                                onClick={handleAIBreakdown}
                                disabled={isThisTaskGenerating}
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
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
