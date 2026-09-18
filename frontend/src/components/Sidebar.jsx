import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LayoutDashboard, FolderKanban, ChevronDown, Plus, UserPlus, Building2 } from "lucide-react";
import { fetchWorkspaces, setCurrentWorkspace } from "../features/workspaceSlice";

const Sidebar = ({ onOpenCreateWorkspace, onOpenInviteMember }) => {
  const dispatch = useDispatch();
  const { workspaces, currentWorkspace } = useSelector((s) => s.workspace);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (workspaces.length === 0) dispatch(fetchWorkspaces());
  }, [dispatch, workspaces.length]);

  const handleSwitch = (ws) => {
    dispatch(setCurrentWorkspace(ws));
    setDropdownOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-sidebar-accent text-accent-foreground"
        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-secondary"
    }`;

  return (
    <aside className="w-64 min-h-screen bg-[var(--sidebar)] border-r border-border flex flex-col fixed top-0 left-0">

      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
        <span className="text-lg font-bold text-foreground tracking-tight">Axora</span>
      </div>

      {/* Workspace switcher */}
      <div className="px-3 pt-4 pb-2 relative">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg px-3 py-2.5 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
              {currentWorkspace?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <span className="text-sm font-medium text-foreground truncate">
              {currentWorkspace?.name ?? "No workspace"}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
            {workspaces.length > 0 && (
              <div className="py-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => handleSwitch(ws)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      ws._id === currentWorkspace?._id
                        ? "text-primary bg-accent"
                        : "text-popover-foreground hover:bg-secondary"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="border-t border-border py-1">
              <button
                onClick={() => { setDropdownOpen(false); onOpenCreateWorkspace?.(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Workspace
              </button>
              <button
                onClick={() => { setDropdownOpen(false); onOpenInviteMember?.(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-secondary transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Invite Member
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-2 space-y-1">
        <NavLink to="/dashboard" className={navLinkClass} end>
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          Dashboard
        </NavLink>
        <NavLink to="/projects" className={navLinkClass}>
          <FolderKanban className="w-4 h-4 shrink-0" />
          Projects
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Axora MVP v0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
