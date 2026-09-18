import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import Sidebar               from "./Sidebar";
import Topbar                from "./Topbar";
import CreateWorkspaceModal  from "./modals/CreateWorkspaceModal";
import InviteMemberModal     from "./modals/InviteMemberModal";
import { fetchWorkspaces }    from "../features/workspaceSlice";

const AppLayout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { workspaces, currentWorkspace, loading } = useSelector((s) => s.workspace);

  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isInviteMemberOpen,    setIsInviteMemberOpen]    = useState(false);

  useEffect(() => {
    if (isAuthenticated && workspaces.length === 0) {
      dispatch(fetchWorkspaces());
    }
  }, [isAuthenticated, workspaces.length, dispatch]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">

      {/* Fixed sidebar */}
      <Sidebar
        onOpenCreateWorkspace={() => setIsCreateWorkspaceOpen(true)}
        onOpenInviteMember={()    => setIsInviteMemberOpen(true)}
      />

      {/* Main content - offset by sidebar width */}
      <div className="flex-1 flex flex-col min-h-screen pl-64">
        <Topbar />
        <main className="p-8 flex-1 overflow-y-auto">
          {loading && !currentWorkspace && workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading workspace...</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Real modals */}
      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
      />
      <InviteMemberModal
        isOpen={isInviteMemberOpen}
        onClose={() => setIsInviteMemberOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
