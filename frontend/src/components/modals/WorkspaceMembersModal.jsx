import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    X,
    Users,
    UserPlus,
    Shield,
    Trash2,
    Copy,
    Check,
    Loader2,
    Mail,
    Clock,
    AlertCircle,
    UserCheck,
} from "lucide-react";
import {
    sendWorkspaceInvite,
    removeWorkspaceMember,
    updateWorkspaceMemberRole,
    fetchWorkspaceDetails,
    clearWorkspaceError,
} from "../../features/workspaceSlice";

const ROLE_BADGES = {
    owner:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
    admin:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
    member: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    viewer: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const WorkspaceMembersModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();

    const { currentWorkspace, loading, membersLoading, error } = useSelector((s) => s.workspace);
    const { user: currentUser } = useSelector((s) => s.auth);

    const [activeTab,    setActiveTab]    = useState("members"); // "members" | "invites"
    const [inviteEmail,  setInviteEmail]  = useState("");
    const [inviteRole,   setInviteRole]   = useState("member");
    const [copiedLink,   setCopiedLink]   = useState(null);
    const [lastInviteUrl, setLastInviteUrl] = useState(null);
    const [actionMsg,    setActionMsg]    = useState(null);

    // Refresh workspace details when modal opens
    useEffect(() => {
        if (isOpen && currentWorkspace?._id) {
            dispatch(fetchWorkspaceDetails(currentWorkspace._id));
            dispatch(clearWorkspaceError());
            setActionMsg(null);
            setLastInviteUrl(null);
        }
    }, [isOpen, currentWorkspace?._id, dispatch]);

    if (!isOpen || !currentWorkspace) return null;

    const members = currentWorkspace.members || [];
    const invitations = currentWorkspace.invitations || [];

    // Determine current user's role in this workspace
    const currentUserId = currentUser?._id?.toString();
    const isOwner =
        currentWorkspace.createdBy === currentUserId ||
        (currentWorkspace.createdBy?._id || currentWorkspace.createdBy)?.toString() === currentUserId ||
        members.some((m) => (m.user?._id || m.user)?.toString() === currentUserId && m.role === "owner");

    const currentMemberEntry = members.find(
        (m) => (m.user?._id || m.user)?.toString() === currentUserId
    );
    const isAdmin = isOwner || currentMemberEntry?.role === "admin";
    const canManageMembers = isOwner || isAdmin;

    const handleSendInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail || !inviteEmail.trim()) return;

        setActionMsg(null);
        const result = await dispatch(
            sendWorkspaceInvite({
                workspaceId: currentWorkspace._id,
                email: inviteEmail.trim(),
                role: inviteRole,
            })
        );

        if (result.meta.requestStatus === "fulfilled") {
            setLastInviteUrl(result.payload.inviteLink);
            setInviteEmail("");
            setActionMsg({ type: "success", text: `Invitation sent to ${inviteEmail}` });
        }
    };

    const handleCopy = (url, key) => {
        navigator.clipboard.writeText(url);
        setCopiedLink(key);
        setTimeout(() => setCopiedLink(null), 2000);
    };

    const handleRemoveMember = async (memberId, memberName) => {
        if (!window.confirm(`Are you sure you want to remove ${memberName || "this member"} from the workspace?`)) {
            return;
        }
        setActionMsg(null);
        const result = await dispatch(
            removeWorkspaceMember({
                workspaceId: currentWorkspace._id,
                memberId,
            })
        );
        if (result.meta.requestStatus === "fulfilled") {
            setActionMsg({ type: "success", text: "Member removed from workspace" });
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        setActionMsg(null);
        const result = await dispatch(
            updateWorkspaceMemberRole({
                workspaceId: currentWorkspace._id,
                memberId,
                role: newRole,
            })
        );
        if (result.meta.requestStatus === "fulfilled") {
            setActionMsg({ type: "success", text: `Role updated to ${newRole}` });
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">Workspace Members</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Manage team access & roles for <span className="text-foreground font-medium">{currentWorkspace.name}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs & Search */}
                <div className="flex items-center justify-between px-6 pt-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab("members")}
                            className={`pb-3 text-xs font-semibold px-2 border-b-2 transition-colors ${
                                activeTab === "members"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Members ({members.length})
                        </button>
                        {canManageMembers && (
                            <button
                                onClick={() => setActiveTab("invites")}
                                className={`pb-3 text-xs font-semibold px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                                    activeTab === "invites"
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Pending Invites
                                {invitations.length > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-secondary border border-border text-[10px] flex items-center justify-center font-bold">
                                        {invitations.length}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Alerts / Feedback */}
                    {error && (
                        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl p-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {actionMsg && (
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-3">
                            <UserCheck className="w-4 h-4 shrink-0" />
                            <span>{actionMsg.text}</span>
                        </div>
                    )}

                    {/* Quick Invite Box (Admins & Owners) */}
                    {canManageMembers && (
                        <div className="bg-secondary/40 border border-border/70 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-primary" />
                                <span className="text-xs font-semibold text-foreground">Invite New Team Member</span>
                            </div>

                            <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-2.5">
                                <div className="relative flex-1">
                                    <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        required
                                        className="w-full bg-background text-foreground text-xs rounded-lg pl-9 pr-3 py-2.5 border border-border outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="bg-background text-foreground text-xs rounded-lg px-3 py-2.5 border border-border outline-none focus:ring-1 focus:ring-primary cursor-pointer shrink-0"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={loading || !inviteEmail.trim()}
                                    className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shrink-0 cursor-pointer"
                                >
                                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send Invite"}
                                </button>
                            </form>

                            {/* Last Generated Invite Link */}
                            {lastInviteUrl && (
                                <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center justify-between gap-2 text-xs">
                                    <span className="text-muted-foreground truncate max-w-sm">
                                        Invite Link: <span className="text-primary font-mono text-[11px]">{lastInviteUrl}</span>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(lastInviteUrl, "last")}
                                        className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-semibold px-2 py-1 rounded bg-primary/10 transition-colors shrink-0"
                                    >
                                        {copiedLink === "last" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        {copiedLink === "last" ? "Copied!" : "Copy Link"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Members List */}
                    {activeTab === "members" && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                Current Members ({members.length})
                            </h3>
                            <div className="divide-y divide-border/50 rounded-xl border border-border/60 overflow-hidden bg-card">
                                {members.map((m) => {
                                    const userObj = m.user || {};
                                    const memberId = m._id;
                                    const userId = (userObj._id || userObj).toString();
                                    const name = userObj.name || "Member";
                                    const email = userObj.email || "";
                                    const role = m.role || "member";
                                    const isMe = userId === currentUserId;
                                    const isMemberOwner = role === "owner" || userId === (currentWorkspace.createdBy?._id || currentWorkspace.createdBy)?.toString();

                                    const initials = name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase();

                                    return (
                                        <div
                                            key={memberId || userId}
                                            className="flex items-center justify-between p-3.5 hover:bg-secondary/20 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                                    {initials}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-foreground truncate">
                                                            {name}
                                                        </span>
                                                        {isMe && (
                                                            <span className="px-1.5 py-0.2 rounded bg-secondary text-[10px] text-muted-foreground font-medium">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground truncate">{email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Role management: Only workspace owner can change roles */}
                                                {isOwner && !isMemberOwner ? (
                                                    <select
                                                        value={role}
                                                        onChange={(e) => handleRoleChange(memberId, e.target.value)}
                                                        disabled={membersLoading}
                                                        className="text-xs bg-secondary text-foreground border border-border rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-primary"
                                                    >
                                                        <option value="admin">Admin</option>
                                                        <option value="member">Member</option>
                                                        <option value="viewer">Viewer</option>
                                                    </select>
                                                ) : (
                                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${
                                                        ROLE_BADGES[role] || ROLE_BADGES.member
                                                    }`}>
                                                        {role}
                                                    </span>
                                                )}

                                                {/* Remove Member Button */}
                                                {canManageMembers && !isMemberOwner && !isMe && (isOwner || role !== "admin") && (
                                                    <button
                                                        onClick={() => handleRemoveMember(memberId, name)}
                                                        disabled={membersLoading}
                                                        title="Remove member"
                                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tab: Pending Invites */}
                    {activeTab === "invites" && canManageMembers && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                Pending Invitations ({invitations.length})
                            </h3>
                            {invitations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                                    No pending invitations. Use the form above to invite team members.
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50 rounded-xl border border-border/60 overflow-hidden bg-card">
                                    {invitations.map((inv) => {
                                        const clientUrl = window.location.origin;
                                        const inviteUrl = `${clientUrl}/invite/${inv.token}`;
                                        const isExpired = new Date(inv.expiresAt) < new Date();

                                        return (
                                            <div
                                                key={inv.token}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-secondary/20 transition-colors"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-foreground truncate">
                                                            {inv.email}
                                                        </span>
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                                                            ROLE_BADGES[inv.role] || ROLE_BADGES.member
                                                        }`}>
                                                            {inv.role}
                                                        </span>
                                                        {isExpired && (
                                                            <span className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 px-1.5 py-0.2 rounded font-medium">
                                                                Expired
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Clock className="w-3 h-3" /> Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleCopy(inviteUrl, inv.token)}
                                                        className="flex items-center gap-1.5 text-xs text-foreground bg-secondary hover:bg-secondary/80 border border-border px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        {copiedLink === inv.token ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                        <span>{copiedLink === inv.token ? "Copied" : "Copy Link"}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex justify-end shrink-0 bg-secondary/20">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceMembersModal;
