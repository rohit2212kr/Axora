import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { X, Loader2, UserPlus, Copy, Check, Mail } from "lucide-react";
import { sendWorkspaceInvite, clearWorkspaceError } from "../../features/workspaceSlice";

const InviteMemberModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const { currentWorkspace, loading, error } = useSelector((s) => s.workspace);

    const [inviteLink, setInviteLink] = useState(null);
    const [copied, setCopied] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: { role: "member" },
    });

    useEffect(() => {
        if (!isOpen) {
            reset();
            setInviteLink(null);
            setCopied(false);
            dispatch(clearWorkspaceError());
        }
    }, [isOpen, reset, dispatch]);

    const onSubmit = async ({ email, role }) => {
        if (!currentWorkspace) return;
        const result = await dispatch(
            sendWorkspaceInvite({
                workspaceId: currentWorkspace._id,
                email,
                role,
            })
        );
        if (result.meta.requestStatus === "fulfilled") {
            setInviteLink(result.payload.inviteLink);
        }
    };

    const handleCopy = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={onClose}
        >
            <div
                className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Invite Member</h2>
                            {currentWorkspace && (
                                <p className="text-xs text-muted-foreground mt-0.5">to {currentWorkspace.name}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-xl p-3">
                            {error}
                        </div>
                    )}

                    {!currentWorkspace && (
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-xl p-3">
                            Please select a workspace first.
                        </div>
                    )}

                    {inviteLink ? (
                        <div className="space-y-4 py-2">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-sm font-semibold text-foreground">Invitation Link Generated!</h3>
                                <p className="text-xs text-muted-foreground">
                                    An email was dispatched. You can also copy and send this link directly:
                                </p>
                            </div>

                            <div className="bg-secondary/60 border border-border rounded-xl p-2.5 flex items-center justify-between gap-2">
                                <span className="text-xs text-foreground font-mono truncate max-w-[260px]">
                                    {inviteLink}
                                </span>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={onClose}
                                    className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl py-2.5 text-xs transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Email Address <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="colleague@example.com"
                                    {...register("email", {
                                        required: "Email is required",
                                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                                    })}
                                    className={`w-full bg-muted text-foreground placeholder-muted-foreground rounded-xl px-3.5 py-2.5 text-xs border outline-none transition focus:ring-1 focus:ring-primary ${
                                        errors.email ? "border-destructive/60" : "border-border"
                                    }`}
                                />
                                {errors.email && <p className="mt-1 text-[11px] text-destructive">{errors.email.message}</p>}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">Assigned Role</label>
                                <select
                                    {...register("role")}
                                    className="w-full bg-muted text-foreground rounded-xl px-3.5 py-2.5 text-xs border border-border outline-none transition focus:ring-1 focus:ring-primary cursor-pointer"
                                >
                                    <option value="member">Member (Can edit tasks and projects)</option>
                                    <option value="admin">Admin (Can manage projects, tasks, & invite members)</option>
                                    <option value="viewer">Viewer (Read-only access)</option>
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !currentWorkspace}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-xl px-5 py-2 text-xs transition-colors shadow-md shadow-primary/20"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...
                                        </>
                                    ) : (
                                        "Send Invitation"
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InviteMemberModal;
