import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

const COLUMN_STYLES = {
    todo:        { dot: "bg-slate-500",   header: "text-slate-300" },
    in_progress: { dot: "bg-amber-400",   header: "text-amber-300" },
    in_review:   { dot: "bg-blue-400",    header: "text-blue-300"  },
    completed:   { dot: "bg-emerald-400", header: "text-emerald-300" },
};

const KanbanColumn = ({ title, statusKey, tasks, workspaceId, projectId, onAddTask }) => {
    const style = COLUMN_STYLES[statusKey] ?? COLUMN_STYLES.todo;

    return (
        <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl min-h-[480px] w-full">

            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <h3 className={`text-sm font-semibold ${style.header}`}>{title}</h3>
                    <span className="bg-slate-800 text-slate-400 text-xs font-medium rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={() => onAddTask(statusKey)}
                    title={`Add task to ${title}`}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-600/10 transition-all"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Task list */}
            <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">
                {tasks.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-600 text-xs text-center">No tasks yet</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            workspaceId={workspaceId}
                            projectId={projectId}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
