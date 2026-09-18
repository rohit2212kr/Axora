import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { X, Loader2, UserPlus } from "lucide-react";
import { inviteMember, clearWorkspaceError } from "../../features/workspaceSlice";

const InviteMemberModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { currentWorkspace, loading, error } = useSelector((s) => s.workspace);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { role: "member" },
  });

  useEffect(() => {
    if (!isOpen) { reset(); dispatch(clearWorkspaceError()); }
  }, [isOpen, reset, dispatch]);

  const onSubmit = async ({ email, role }) => {
    if (!currentWorkspace) return;
    const result = await dispatch(inviteMember({ workspaceId: currentWorkspace._id, email, role }));
    if (result.meta.requestStatus === "fulfilled") { onClose(); reset(); }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Invite Member</h2>
              {currentWorkspace && (
                <p className="text-xs text-muted-foreground mt-0.5">to {currentWorkspace.name}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {!currentWorkspace && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-lg px-4 py-2.5">
              Please select a workspace first.
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email Address <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              placeholder="colleague@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
              })}
              className={`w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg px-3.5 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-ring ${
                errors.email ? "border-destructive/60" : "border-border focus:border-ring"
              }`}
            />
            {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
            <select
              {...register("role")}
              className="w-full bg-muted text-foreground rounded-lg px-3.5 py-2.5 text-sm border border-border outline-none transition focus:ring-2 focus:ring-ring focus:border-ring cursor-pointer"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !currentWorkspace}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-lg px-5 py-2 text-sm transition-colors">
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Inviting...</> : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
