import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { fetchTasks, clearTasks } from "../features/taskSlice";
import KanbanColumn from "../components/kanban/KanbanColumn";
import CreateTaskModal from "../components/modals/CreateTaskModal";

// Kanban columns — using exact backend status enum values
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

    // Derive project name from the cached list (no extra fetch needed)
    const project = projects.find((p) => p._id === projectId);

    useEffect(() => {
        if (!currentWorkspace?._id || !projectId) return;
        dispatch(fetchTasks({ workspaceId: currentWorkspace._id, projectId }));

        // Clear tasks when leaving this board
        return () => { dispatch(clearTasks()); };
    }, [currentWorkspace?._id, projectId, dispatch]);

    const openCreateModal = (status = "todo") => {
        setDefaultStatus(status);
        setModalOpen(true);
    };

    // Group tasks by status for each column
    const tasksByStatus = COLUMNS.reduce((acc, col) => {
        acc[col.key] = tasks.filter((t) => t.status === col.key);
        return acc;
    }, {});

    // Guard: no workspace selected
    if (!currentWorkspace) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <p className="text-slate-400 text-sm">Select a workspace from the sidebar to view this board.</p>
                <button onClick={() => navigate("/projects")}
                    className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
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
                        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Projects
                    </button>
                    <span className="text-slate-700">/</span>
                    <h1 className="text-lg font-bold text-white truncate max-w-xs">
                        {project?.name ?? "Board"}
                    </h1>
                </div>
                <button
                    onClick={() => openCreateModal("todo")}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center flex-1 gap-2 text-slate-400">
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
                            tasks={tasksByStatus[col.key]}
                            workspaceId={currentWorkspace._id}
                            projectId={projectId}
                            onAddTask={openCreateModal}
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
        </div>
    );
};

export default ProjectBoard;
