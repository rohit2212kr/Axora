import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Plus, Loader2, Users, Wifi, X as CloseIcon } from "lucide-react";
import {
    fetchTasks,
    clearTasks,
    updateTaskStatus,
    taskCreatedFromSocket,
    taskUpdatedFromSocket,
    taskDeletedFromSocket,
    taskCommentFromSocket,
} from "../features/taskSlice";
import {
    connectSocket,
    joinProject,
    leaveProject,
} from "../socket/socketService";
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
    const { user: currentUser, token: authToken } = useSelector((s) => s.auth);

    const [modalOpen,            setModalOpen]            = useState(false);
    const [defaultStatus,        setDefaultStatus]        = useState("todo");
    const [selectedTaskId,       setSelectedTaskId]       = useState(null);
    const [activeCollaborators,  setActiveCollaborators]  = useState([]);
    const [toasts,               setToasts]               = useState([]);

    const project = projects.find((p) => p._id === projectId);

    // ── Fetch tasks for project ──────────────────────────────────────────────
    useEffect(() => {
        if (!currentWorkspace?._id || !projectId) return;
        dispatch(fetchTasks({ workspaceId: currentWorkspace._id, projectId }));

        return () => {
            dispatch(clearTasks());
        };
    }, [currentWorkspace?._id, projectId, dispatch]);

    // ── Real-time Socket.io Collaboration ────────────────────────────────────
    const addToast = (notification) => {
        const id = Date.now() + Math.random().toString(36).substring(2, 7);
        setToasts((prev) => [...prev.slice(-3), { id, ...notification }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4500);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    useEffect(() => {
        if (!projectId) return;

        const token = authToken || localStorage.getItem("axora_token");
        const socket = connectSocket(token);

        if (!socket) return;

        joinProject(projectId);

        const handlePresenceSync = ({ activeUsers }) => {
            if (Array.isArray(activeUsers)) {
                setActiveCollaborators(activeUsers);
            }
        };

        const handleTaskCreated = (data) => {
            if (data?.task) {
                dispatch(taskCreatedFromSocket(data.task));
                if (data.user?._id !== currentUser?._id) {
                    addToast({
                        type: "created",
                        userName: data.user?.name || "A collaborator",
                        message: `created task "${data.task.title}"`,
                    });
                }
            }
        };

        const handleTaskUpdated = (data) => {
            if (data?.task) {
                dispatch(taskUpdatedFromSocket(data.task));
                if (data.user?._id !== currentUser?._id) {
                    addToast({
                        type: "updated",
                        userName: data.user?.name || "A collaborator",
                        message: `updated task "${data.task.title}"`,
                    });
                }
            }
        };

        const handleTaskDeleted = (data) => {
            if (data?.taskId) {
                dispatch(taskDeletedFromSocket(data.taskId));
                if (data.user?._id !== currentUser?._id) {
                    addToast({
                        type: "deleted",
                        userName: data.user?.name || "A collaborator",
                        message: "deleted a task",
                    });
                }
            }
        };

        const handleTaskComment = (data) => {
            if (data) {
                dispatch(taskCommentFromSocket(data));
                if (data.user?._id !== currentUser?._id) {
                    const actionWord = data.action === "deleted" ? "deleted a comment on" : "commented on";
                    addToast({
                        type: "comment",
                        userName: data.user?.name || "A collaborator",
                        message: `${actionWord} "${data.task?.title || "a task"}"`,
                    });
                }
            }
        };

        socket.on("presence:sync", handlePresenceSync);
        socket.on("task:created", handleTaskCreated);
        socket.on("task:updated", handleTaskUpdated);
        socket.on("task:deleted", handleTaskDeleted);
        socket.on("task:comment", handleTaskComment);

        return () => {
            socket.off("presence:sync", handlePresenceSync);
            socket.off("task:created", handleTaskCreated);
            socket.off("task:updated", handleTaskUpdated);
            socket.off("task:deleted", handleTaskDeleted);
            socket.off("task:comment", handleTaskComment);
            leaveProject(projectId);
        };
    }, [projectId, authToken, currentUser?._id, dispatch]);

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
                <button
                    onClick={() => navigate("/projects")}
                    className="text-primary hover:text-primary/80 text-sm transition-colors"
                >
                    ← Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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

                <div className="flex items-center gap-3">
                    {/* Live Collaboration Presence Avatars */}
                    {activeCollaborators.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/70 border border-border/80 text-xs shadow-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-muted-foreground font-medium hidden md:inline">
                                {activeCollaborators.length} {activeCollaborators.length === 1 ? "collaborator active" : "collaborators active"}
                            </span>

                            {/* Avatars */}
                            <div className="flex -space-x-1.5 overflow-hidden pl-1">
                                {activeCollaborators.slice(0, 4).map((u, i) => {
                                    const initials = (u.name || "U")
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase();
                                    const isMe = u._id === currentUser?._id;
                                    return (
                                        <div
                                            key={u._id || i}
                                            title={`${u.name || "Collaborator"}${isMe ? " (You)" : ""}`}
                                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ring-2 ring-card select-none cursor-pointer transition-transform hover:scale-110 ${
                                                isMe
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "bg-indigo-600/90 text-white"
                                            }`}
                                        >
                                            {initials}
                                        </div>
                                    );
                                })}
                                {activeCollaborators.length > 4 && (
                                    <div
                                        title={`+${activeCollaborators.length - 4} more collaborators`}
                                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-semibold bg-secondary text-muted-foreground ring-2 ring-card"
                                    >
                                        +{activeCollaborators.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => openCreateModal("todo")}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-foreground font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4" />
                        Add Task
                    </button>
                </div>
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

            {/* Floating Live Collaboration Toasts */}
            {toasts.length > 0 && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-card/95 backdrop-blur-md border border-border shadow-xl shadow-black/40 transition-all duration-300"
                        >
                            <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Wifi className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-foreground leading-snug">
                                    <span className="font-semibold text-primary">{toast.userName}</span>{" "}
                                    {toast.message}
                                </p>
                                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                                    Just now
                                </span>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                            >
                                <CloseIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectBoard;
