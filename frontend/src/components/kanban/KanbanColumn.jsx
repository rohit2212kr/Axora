import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

const KanbanColumn = ({ title, statusKey, tasks = [], workspaceId, projectId, onAddTask, onSelectTask }) => {
    return (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col max-h-full min-h-[500px]">

            {/* Column header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800/60 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{title}</span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-800 border border-slate-700/60 rounded-full px-2 py-0.5">
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={() => onAddTask(statusKey)}
                    className="text-slate-500 hover:text-indigo-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    title={`Add task to ${title}`}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Tasks scroll container */}
            <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto">
                {tasks.map((task) => (
                    <TaskCard
                        key={task._id}
                        task={task}
                        workspaceId={workspaceId}
                        projectId={projectId}
                        onSelectTask={onSelectTask}
                    />
                ))}

                {tasks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-10 border border-dashed border-slate-800/80 rounded-xl text-center p-4">
                        <p className="text-xs text-slate-600">No tasks in this column</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
