import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    Building2,
    Users,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Loader2,
    LogIn,
    UserPlus,
    Clock,
    Shield,
} from "lucide-react";
import {
    getInviteDetails,
    acceptWorkspaceInvite,
    clearActiveInvite,
} from "../features/workspaceSlice";

const ROLE_BADGES = {
    owner:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
    admin:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
    member: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    viewer: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const InviteAcceptPage = () => {
    const { token } = useParams();
    const navigate  = useNavigate();
    const dispatch  = useDispatch();

    const { isAuthenticated, user: currentUser } = useSelector((s) => s.auth);
    const { activeInvite, inviteLoading, inviteError } = useSelector((s) => s.workspace);

    const [accepting, setAccepting] = useState(false);
    const [accepted,  setAccepted]  = useState(false);
    const [errorMsg,  setErrorMsg]  = useState(null);

    useEffect(() => {
        if (!token) return;
        dispatch(getInviteDetails(token));
        return () => {
            dispatch(clearActiveInvite());
        };
    }, [token, dispatch]);

    const handleAccept = async () => {
        if (!token) return;
        setAccepting(true);
        setErrorMsg(null);

        const result = await dispatch(acceptWorkspaceInvite(token));
        setAccepting(false);

        if (result.meta.requestStatus === "fulfilled") {
            setAccepted(true);
            setTimeout(() => {
                navigate("/dashboard");
            }, 1800);
        } else {
            setErrorMsg(result.payload || "Failed to accept invitation");
        }
    };

    const formattedRole = activeInvite?.role
        ? activeInvite.role.charAt(0).toUpperCase() + activeInvite.role.slice(1)
        : "Member";

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background subtle gradient elements */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Brand header */}
                <div className="text-center mb-8">
                    <span className="text-2xl font-extrabold tracking-wider text-foreground">
                        AXORA<span className="text-primary text-3xl leading-none">.</span>
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                        Collaborative Workspace Platform
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
                    {/* Loading State */}
                    {inviteLoading && !activeInvite && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Validating invitation link...</p>
                        </div>
                    )}

                    {/* Error / Expired State */}
                    {inviteError && !inviteLoading && (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Invitation Invalid</h2>
                                <p className="text-sm text-muted-foreground mt-1.5 px-4">
                                    {inviteError}
                                </p>
                            </div>
                            <div className="pt-2">
                                <Link
                                    to="/"
                                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                                >
                                    Return to Home <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Success State */}
                    {accepted && (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Welcome to the Team!</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    You've successfully joined <span className="font-semibold text-foreground">{activeInvite?.workspaceName}</span>.
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Redirecting to your dashboard...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Invitation Content */}
                    {!inviteLoading && !inviteError && !accepted && activeInvite && (
                        <div className="space-y-6">
                            {/* Inviter Info */}
                            <div className="text-center space-y-1">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground tracking-tight">
                                    Join {activeInvite.workspaceName}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Invited by <span className="font-semibold text-foreground">{activeInvite.inviterName}</span>
                                </p>
                            </div>

                            {/* Workspace Box */}
                            <div className="bg-secondary/50 border border-border/80 rounded-xl p-4 space-y-2.5">
                                {activeInvite.workspaceDescription && (
                                    <p className="text-xs text-muted-foreground italic">
                                        "{activeInvite.workspaceDescription}"
                                    </p>
                                )}
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5" /> Assigned Role:
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${
                                        ROLE_BADGES[activeInvite.role] || ROLE_BADGES.member
                                    }`}>
                                        {formattedRole}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" /> Link Expires:
                                    </span>
                                    <span className="text-foreground text-[11px]">
                                        {activeInvite.expiresAt ? new Date(activeInvite.expiresAt).toLocaleDateString() : "7 days"}
                                    </span>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg p-3">
                                    {errorMsg}
                                </div>
                            )}

                            {/* Conditional Actions based on Auth status */}
                            {isAuthenticated ? (
                                <div className="space-y-3 pt-2">
                                    <div className="text-xs text-muted-foreground text-center">
                                        Joining as <span className="font-semibold text-foreground">{currentUser?.name || currentUser?.email}</span>
                                    </div>
                                    <button
                                        onClick={handleAccept}
                                        disabled={accepting}
                                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold rounded-xl py-3 px-4 text-sm transition-all shadow-lg shadow-primary/25 cursor-pointer"
                                    >
                                        {accepting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Joining workspace...
                                            </>
                                        ) : (
                                            <>
                                                Accept Invitation <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 pt-2">
                                    <p className="text-xs text-muted-foreground text-center mb-3">
                                        Log in with an existing account or register to accept this invitation.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link
                                            to={`/login?redirect=/invite/${token}`}
                                            className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl py-2.5 px-3 text-xs border border-border transition-colors text-center"
                                        >
                                            <LogIn className="w-3.5 h-3.5" /> Log in
                                        </Link>
                                        <Link
                                            to={`/signup?redirect=/invite/${token}`}
                                            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-2.5 px-3 text-xs transition-colors text-center shadow-md shadow-primary/20"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" /> Sign up
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InviteAcceptPage;
