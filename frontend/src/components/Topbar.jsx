import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../features/authSlice";
import { LogOut } from "lucide-react";

const Topbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user }             = useSelector((s) => s.auth);
  const { currentWorkspace } = useSelector((s) => s.workspace);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">

      {/* Workspace badge */}
      <div className="flex items-center gap-2">
        {currentWorkspace ? (
          <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary border border-primary/30 text-xs font-medium rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {currentWorkspace.name}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">No workspace selected</span>
        )}
      </div>

      {/* User section */}
      <div className="flex items-center gap-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
