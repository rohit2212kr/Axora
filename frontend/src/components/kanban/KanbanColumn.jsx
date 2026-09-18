import { useState } from "react";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

const KanbanColumn = ({
    title,
    statusKey,
    tasks = [],
    workspaceId,
    projectId,
    onAddTask,
    onSelectTask,
    onDropTask,
}) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        onDropTask?.(e, statusKey);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border rounded-2xl flex flex-col max-h-full min-h-[520px] transition-all duration-200 ${
                isDragOver
                    ? "bg-accent/30 border-primary/60 ring-2 ring-primary/40 shadow-lg shadow-primary/10"
                    : "bg-muted/40 border-border"
            }`}
        >
            {/* Column header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{title}</span>
                    <span className="text-xs font-medium text-muted-foreground bg-secondary border border-border rounded-full px-2 py-0.5 font-mono">
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={() => onAddTask(statusKey)}
                    className="text-muted-foreground hover:text-primary p-1 rounded-lg hover:bg-secondary transition-colors"
                    title={`Add task to ${title}`}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Tasks scroll container & drop zone */}
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
                    <div className={`flex-1 flex flex-col items-center justify-center py-10 border border-dashed rounded-xl text-center p-4 transition-colors ${
                        isDragOver ? "border-primary text-primary" : "border-border text-muted-foreground"
                    }`}>
                        <p className="text-xs">
                            {isDragOver ? "Drop task here" : "No tasks in this column"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
