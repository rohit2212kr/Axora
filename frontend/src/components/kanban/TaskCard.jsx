import { useState } from "react";
import { useDispatch } from "react-redux";
import { Calendar, Trash2 } from "lucide-react";
import { updateTaskStatus, deleteTask } from "../../features/taskSlice";

const PRIORITY_STYLES = {
    low:    "text-slate-400 bg-slate-800       border-slate-700",
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

const TaskCard = ({ task, workspaceId, projectId }) => {
    const dispatch = useDispatch();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleStatusChange = (e) => {
        dispatch(updateTaskStatus({ workspaceId, projectId, taskId: task._id, status: e.target.value }));
    };

    const handleDelete = () => {
        dispatch(deleteTask({ workspaceId, projectId, taskId: task._id }));
    };

    const overdue = isOverdue(task.dueDate) && task.status !== "completed";

    return (
        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col gap-3 transition-all group cursor-default">

            {/* Top row: priority + delete */}
            <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex items-center border rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium}`}>
                    {task.priority}
                </span>

                {/* Delete control */}
                <div className="shrink-0">
                    {confirmDelete ? (
                        <div className="flex items-center gap-1.5">
                            <button onClick={handleDelete}
                                className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
                                Confirm
                            </button>
                            <button onClick={() => setConfirmDelete(false)}
                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setConfirmDelete(true)}
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                            title="Delete task">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-white leading-snug">{task.title}</p>

            {/* Description */}
            {task.description && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{task.description}</p>
            )}

            {/* Footer: due date + status mover */}
            <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                {task.dueDate ? (
                    <span className={`flex items-center gap-1 text-xs ${overdue ? "text-rose-400" : "text-slate-500"}`}>
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                        {overdue && " · Overdue"}
                    </span>
                ) : <span />}

                {/* Quick status mover */}
                <select
                    value={task.status}
                    onChange={handleStatusChange}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-800 border border-slate-700 text-slate-400 text-xs rounded-lg px-2 py-1 outline-none cursor-pointer hover:border-slate-600 transition-colors focus:ring-1 focus:ring-indigo-500"
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
