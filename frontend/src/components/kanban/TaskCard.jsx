import { useState } from "react";
import { useDispatch } from "react-redux";
import { Calendar, Trash2, CheckSquare, GripVertical } from "lucide-react";
import { updateTaskStatus, deleteTask } from "../../features/taskSlice";

const PRIORITY_STYLES = {
    low:    "text-muted-foreground bg-secondary border-border",
    medium: "text-blue-400  bg-blue-500/10     border-blue-500/20",
    high:   "text-amber-400 bg-amber-500/10    border-amber-500/20",
    urgent: "text-rose-400  bg-rose-500/10     border-rose-500/20",
};

const STATUS_OPTIONS = [
    { value: "todo",        label: "To Do"       },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review",   label: "In Review"   },
    { value: "completed",   label: "Completed"   },
];

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

const isOverdue = (dateStr) => dateStr && new Date(dateStr) < new Date();

const TaskCard = ({ task, workspaceId, projectId, onSelectTask }) => {
    const dispatch = useDispatch();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleStatusChange = (e) => {
        e.stopPropagation();
        dispatch(updateTaskStatus({ workspaceId, projectId, taskId: task._id, status: e.target.value }));
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        dispatch(deleteTask({ workspaceId, projectId, taskId: task._id }));
    };

    const handleDragStart = (e) => {
        e.dataTransfer.setData("text/plain", task._id);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const overdue = isOverdue(task.dueDate) && task.status !== "completed";
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;

    return (
        <div
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={() => onSelectTask?.(task)}
            className={`bg-card text-card-foreground border border-border hover:border-zinc-500 hover:shadow-lg hover:shadow-black/20 rounded-xl p-4 flex flex-col gap-3 transition-all group cursor-grab active:cursor-grabbing select-none ${
                isDragging ? "opacity-40 border-dashed border-primary scale-[0.98]" : ""
            }`}
        >
            {/* Top row: priority + drag grip + delete */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                    <span className={`inline-flex items-center border rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium}`}>
                        {task.priority}
                    </span>
                </div>

                {/* Delete control */}
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {confirmDelete ? (
                        <div className="flex items-center gap-1.5">
                            <button onClick={handleDelete}
                                className="text-xs text-destructive hover:text-destructive/80 font-medium transition-colors">
                                Confirm
                            </button>
                            <button onClick={() => setConfirmDelete(false)}
                                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setConfirmDelete(true)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            title="Delete task">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
                {task.title}
            </p>

            {/* Description */}
            {task.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{task.description}</p>
            )}

            {/* Subtasks pill if present */}
            {subtasks.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-md font-medium">
                        <CheckSquare className="w-3 h-3 text-primary" />
                        {completedSubtasks}/{subtasks.length} subtasks
                    </span>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.round((completedSubtasks / subtasks.length) * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Footer: due date + status mover */}
            <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                {task.dueDate ? (
                    <span className={`flex items-center gap-1 text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                        {overdue && " • Overdue"}
                    </span>
                ) : <span />}

                {/* Quick status mover */}
                <select
                    value={task.status}
                    onChange={handleStatusChange}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-secondary border border-border text-muted-foreground text-xs rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-zinc-500 transition-colors focus:ring-1 focus:ring-ring"
                >
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default TaskCard;
