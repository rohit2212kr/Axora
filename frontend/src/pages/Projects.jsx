import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Trash2, FolderKanban } from "lucide-react";
import { fetchProjects, deleteProject } from "../features/workspaceSlice";
import CreateProjectModal from "../components/modals/CreateProjectModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
    planning:  "bg-amber-500/15   text-amber-400   border-amber-500/30",
    active:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    completed: "bg-blue-500/15    text-blue-400    border-blue-500/30",
    archived:  "bg-slate-500/15   text-slate-400   border-slate-500/30",
};

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.archived}`}>
        {status}
    </span>
);

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const CardSkeleton = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse space-y-3">
        <div className="h-4 bg-slate-800 rounded w-2/3" />
        <div className="h-3 bg-slate-800 rounded w-full" />
        <div className="h-3 bg-slate-800 rounded w-4/5" />
        <div className="flex justify-between items-center pt-2">
            <div className="h-5 bg-slate-800 rounded-full w-20" />
            <div className="h-3 bg-slate-800 rounded w-24" />
        </div>
    </div>
);

// ─── Project Card ─────────────────────────────────────────────────────────────
const ProjectCard = ({ project, onDelete, onClick }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div
            onClick={onClick}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-600/40 hover:bg-slate-800/60 rounded-2xl p-5 flex flex-col gap-3 transition-all group cursor-pointer"
        >
            {/* Title & delete */}
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-white font-semibold text-sm leading-snug group-hover:text-indigo-300 transition-colors">
                    {project.name}
                </h3>
                {confirmDelete ? (
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onDelete(project._id)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
                            Confirm
                        </button>
                        <button onClick={() => setConfirmDelete(false)}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all shrink-0"
                        title="Delete project">
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {project.description && (
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{project.description}</p>
            )}

            <div className="flex items-center justify-between mt-auto pt-1">
                <StatusBadge status={project.status} />
                {project.deadline && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(project.deadline)}
                    </span>
                )}
            </div>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const Projects = () => {
    const dispatch  = useDispatch();
    const navigate  = useNavigate();
    const { currentWorkspace, projects, loading } = useSelector((s) => s.workspace);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        if (currentWorkspace?._id) dispatch(fetchProjects(currentWorkspace._id));
    }, [currentWorkspace?._id, dispatch]);

    const handleDelete = (projectId) => {
        if (!currentWorkspace?._id) return;
        dispatch(deleteProject({ workspaceId: currentWorkspace._id, projectId }));
    };

    if (!currentWorkspace) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
                <FolderKanban className="w-12 h-12 text-slate-700" />
                <div>
                    <h2 className="text-lg font-semibold text-white mb-1">No workspace selected</h2>
                    <p className="text-slate-400 text-sm">Select or create a workspace from the sidebar to view projects.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Projects</h1>
                    <p className="text-slate-400 text-sm mt-0.5">{currentWorkspace.name}</p>
                </div>
                <button onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors">
                    <Plus className="w-4 h-4" />
                    Create Project
                </button>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => <CardSkeleton key={n} />)}
                </div>
            )}

            {!loading && projects.length === 0 && (
                <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-14 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center">
                        <FolderKanban className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-1">No projects yet</h3>
                        <p className="text-slate-400 text-sm">Create your first project to get started.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors">
                        <Plus className="w-4 h-4" />
                        Create First Project
                    </button>
                </div>
            )}

            {!loading && projects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project._id}
                            project={project}
                            onDelete={handleDelete}
                            onClick={() => navigate(`/projects/${project._id}`)}
                        />
                    ))}
                </div>
            )}

            <CreateProjectModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                workspaceId={currentWorkspace._id}
            />
        </div>
    );
};

export default Projects;
