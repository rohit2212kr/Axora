import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { X, Loader2, FolderKanban } from "lucide-react";
import { createProject, clearWorkspaceError } from "../../features/workspaceSlice";

const statusOptions = [
  { value: "planning",  label: "Planning"  },
  { value: "active",    label: "Active"    },
  { value: "completed", label: "Completed" },
  { value: "archived",  label: "Archived"  },
];

const CreateProjectModal = ({ isOpen, onClose, workspaceId }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.workspace);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { status: "planning" },
  });

  useEffect(() => {
    if (!isOpen) { reset(); dispatch(clearWorkspaceError()); }
  }, [isOpen, reset, dispatch]);

  const onSubmit = async ({ name, description, status, deadline }) => {
    const result = await dispatch(
      createProject({ workspaceId, name, description, status, deadline: deadline || undefined })
    );
    if (result.meta.requestStatus === "fulfilled") { onClose(); reset(); }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">New Project</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Website Redesign"
              {...register("name", { required: "Project name is required" })}
              className={`w-full bg-slate-800 text-white placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-indigo-500 ${
                errors.name ? "border-red-500/60" : "border-slate-700 focus:border-indigo-500"
              }`}
            />
            {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={2}
              placeholder="Brief description..."
              {...register("description")}
              className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-lg px-3.5 py-2.5 text-sm border border-slate-700 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Status + Deadline row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
              <select
                {...register("status")}
                className="w-full bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-700 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Deadline</label>
              <input
                type="date"
                {...register("deadline")}
                className="w-full bg-slate-800 text-white rounded-lg px-3 py-2.5 text-sm border border-slate-700 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors">
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</> : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
