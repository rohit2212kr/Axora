import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar               from "./Sidebar";
import Topbar                from "./Topbar";
import CreateWorkspaceModal  from "./modals/CreateWorkspaceModal";
import InviteMemberModal     from "./modals/InviteMemberModal";

const AppLayout = () => {
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isInviteMemberOpen,    setIsInviteMemberOpen]    = useState(false);

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
          <Outlet />
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
