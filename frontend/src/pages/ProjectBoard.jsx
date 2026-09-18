import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { fetchTasks, clearTasks, updateTaskStatus } from "../features/taskSlice";
import KanbanColumn from "../components/kanban/KanbanColumn";
import CreateTaskModal from "../components/modals/CreateTaskModal";
import TaskDetailModal from "../components/modals/TaskDetailModal";

const COLUMNS = [
    { key: "todo",        title: "To Do"       },
    { key: "in_progress", title: "In Progress" },
    { key: "in_review",   title: "In Review"   },
    { key: "completed",   title: "Completed"   },
];

const ProjectBoard = () => {
    const { projectId } = useParams();
    const navigate      = useNavigate();
    const dispatch      = useDispatch();

    const { currentWorkspace, projects } = useSelector((s) => s.workspace);
    const { tasks, loading }             = useSelector((s) => s.task);

    const [modalOpen,      setModalOpen]      = useState(false);
    const [defaultStatus,  setDefaultStatus]  = useState("todo");
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const project = projects.find((p) => p._id === projectId);

    useEffect(() => {
        if (!currentWorkspace?._id || !projectId) return;
        dispatch(fetchTasks({ workspaceId: currentWorkspace._id, projectId }));

        return () => { dispatch(clearTasks()); };
    }, [currentWorkspace?._id, projectId, dispatch]);

    const openCreateModal = (status = "todo") => {
        setDefaultStatus(status);
        setModalOpen(true);
    };

    const handleDropTask = (e, targetStatus) => {
        const taskId = e.dataTransfer.getData("text/plain");
        if (!taskId) return;

        const task = tasks.find((t) => t._id === taskId);
        if (!task || task.status === targetStatus) return;

        if (!currentWorkspace?._id || !projectId) return;

        dispatch(
            updateTaskStatus({
                workspaceId: currentWorkspace._id,
                projectId,
                taskId,
                status: targetStatus,
            })
        );
    };

    const tasksByStatus = COLUMNS.reduce((acc, col) => {
        acc[col.key] = tasks.filter((t) => t.status === col.key);
        return acc;
    }, {});

    if (!currentWorkspace) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <p className="text-muted-foreground text-sm">Select a workspace from the sidebar to view this board.</p>
                <button onClick={() => navigate("/projects")}
                    className="text-primary hover:text-primary/80 text-sm transition-colors">
                    ← Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/projects")}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Projects
                    </button>
                    <span className="text-border">/</span>
                    <h1 className="text-lg font-bold text-foreground truncate max-w-xs">
                        {project?.name ?? "Board"}
                    </h1>
                </div>
                <button
                    onClick={() => openCreateModal("todo")}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-foreground font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center flex-1 gap-2 text-muted-foreground min-h-[300px]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading tasks...</span>
                </div>
            )}

            {/* Kanban board */}
            {!loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 items-start">
                    {COLUMNS.map((col) => (
                        <KanbanColumn
                            key={col.key}
                            title={col.title}
                            statusKey={col.key}
                            tasks={tasksByStatus[col.key] || []}
                            workspaceId={currentWorkspace._id}
                            projectId={projectId}
                            onAddTask={openCreateModal}
                            onSelectTask={(task) => setSelectedTaskId(task._id)}
                            onDropTask={handleDropTask}
                        />
                    ))}
                </div>
            )}

            {/* Create task modal */}
            <CreateTaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                workspaceId={currentWorkspace._id}
                projectId={projectId}
                defaultStatus={defaultStatus}
            />

            {/* Task details & AI breakdown modal */}
            <TaskDetailModal
                isOpen={!!selectedTaskId}
                onClose={() => setSelectedTaskId(null)}
                taskId={selectedTaskId}
                workspaceId={currentWorkspace._id}
                projectId={projectId}
            />
        </div>
    );
};

export default ProjectBoard;
