import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/authSlice";
import { LogOut } from "lucide-react";

const Topbar = () => {
  const dispatch = useDispatch();
  const { user }             = useSelector((s) => s.auth);
  const { currentWorkspace } = useSelector((s) => s.workspace);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">

      {/* Workspace badge */}
      <div className="flex items-center gap-2">
        {currentWorkspace ? (
          <span className="inline-flex items-center gap-1.5 bg-indigo-600/15 text-indigo-400 border border-indigo-600/30 text-xs font-medium rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {currentWorkspace.name}
          </span>
        ) : (
          <span className="text-slate-500 text-sm">No workspace selected</span>
        )}
      </div>

      {/* User section */}
      <div className="flex items-center gap-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-slate-200 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-800" />

        {/* Logout */}
        <button
          onClick={() => dispatch(logout())}
          title="Logout"
          className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
