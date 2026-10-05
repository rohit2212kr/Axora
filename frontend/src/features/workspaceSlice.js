import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const extractError = (error) =>
    error.response?.data?.message || error.message || "Something went wrong";

const safeParseJSON = (key) => {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

const storedWorkspace = safeParseJSON("axora_current_workspace");

// ─── Async Thunks ────────────────────────────────────────────────────────────

/** Fetch all workspaces current user belongs to */
export const fetchWorkspaces = createAsyncThunk(
    "workspace/fetchWorkspaces",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/workspaces");
            return data.data; // array of workspaces
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/** Fetch single workspace by ID with populated members and invites */
export const fetchWorkspaceDetails = createAsyncThunk(
    "workspace/fetchWorkspaceDetails",
    async (workspaceId, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/workspaces/${workspaceId}`);
            return data.data;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/** Create a new workspace */
export const createWorkspace = createAsyncThunk(
    "workspace/createWorkspace",
    async ({ name, description }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/workspaces", { name, description });
            return data.data;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/** Send a workspace invitation link via email (Owner / Admin only) */
export const sendWorkspaceInvite = createAsyncThunk(
    "workspace/sendWorkspaceInvite",
    async ({ workspaceId, email, role }, { rejectWithValue }) => {
        try {
            const { data } = await api.post(`/workspaces/${workspaceId}/invites`, {
                email,
                role,
            });
            return data;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

// Backward-compatible alias
export const inviteMember = sendWorkspaceInvite;

/** Validate an invite token and retrieve workspace metadata */
export const getInviteDetails = createAsyncThunk(
    "workspace/getInviteDetails",
    async (token, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/workspaces/invite/${token}`);
            return data.invitation;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/** Accept workspace invitation */
export const acceptWorkspaceInvite = createAsyncThunk(
    "workspace/acceptWorkspaceInvite",
    async (token, { rejectWithValue }) => {
        try {
            const { data } = await api.post(`/workspaces/invite/${token}/accept`);
            return data.workspace;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/** Remove a member from a workspace (Owner / Admin) */
export const removeWorkspaceMember = createAsyncThunk(
    "workspace/removeWorkspaceMember",
    async ({ workspaceId, memberId }, { rejectWithValue }) => {
        try {
            const { data } = await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
            return { workspaceId, memberId, workspace: data.workspace };
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/** Update a member's role (Owner only) */
export const updateWorkspaceMemberRole = createAsyncThunk(
    "workspace/updateWorkspaceMemberRole",
    async ({ workspaceId, memberId, role }, { rejectWithValue }) => {
        try {
            const { data } = await api.patch(`/workspaces/${workspaceId}/members/${memberId}/role`, {
                role,
            });
            return { workspaceId, memberId, role, workspace: data.workspace, member: data.member };
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/** Fetch all projects for a workspace */
export const fetchProjects = createAsyncThunk(
    "workspace/fetchProjects",
    async (workspaceId, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/workspaces/${workspaceId}/projects`);
            return data.projects;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/** Create a new project inside a workspace */
export const createProject = createAsyncThunk(
    "workspace/createProject",
    async ({ workspaceId, name, description, status, deadline }, { rejectWithValue }) => {
        try {
            const { data } = await api.post(`/workspaces/${workspaceId}/projects`, {
                name,
                description,
                status,
                deadline,
            });
            return data.project;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/** Delete a project */
export const deleteProject = createAsyncThunk(
    "workspace/deleteProject",
    async ({ workspaceId, projectId }, { rejectWithValue }) => {
        try {
            await api.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
            return projectId;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/** Fetch workspace dashboard analytics */
export const fetchDashboard = createAsyncThunk(
    "workspace/fetchDashboard",
    async (workspaceId, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/workspaces/${workspaceId}/dashboard`);
            return data.data;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const workspaceSlice = createSlice({
    name: "workspace",
    initialState: {
        workspaces:        [],
        currentWorkspace:  storedWorkspace || null,
        projects:          [],
        dashboard:         null,
        dashboardLoading:  false,
        loading:           false,
        error:             null,
        activeInvite:      null,
        inviteLoading:     false,
        inviteError:       null,
        membersLoading:    false,
    },
    reducers: {
        setCurrentWorkspace(state, action) {
            state.currentWorkspace = action.payload;
            if (action.payload) {
                localStorage.setItem("axora_current_workspace_id", action.payload._id);
                localStorage.setItem("axora_current_workspace", JSON.stringify(action.payload));
            } else {
                localStorage.removeItem("axora_current_workspace_id");
                localStorage.removeItem("axora_current_workspace");
            }
        },
        clearWorkspaceError(state) {
            state.error = null;
            state.inviteError = null;
        },
        clearActiveInvite(state) {
            state.activeInvite = null;
            state.inviteError = null;
            state.inviteLoading = false;
        },
    },
    extraReducers: (builder) => {

        // ── fetchWorkspaces ──────────────────────────────────────────────────
        builder
            .addCase(fetchWorkspaces.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(fetchWorkspaces.fulfilled, (state, action) => {
                state.loading    = false;
                const fetchedList = action.payload ?? [];
                state.workspaces = fetchedList;

                const targetId = localStorage.getItem("axora_current_workspace_id") || state.currentWorkspace?._id;
                const matched = fetchedList.find((ws) => ws._id === targetId);

                if (matched) {
                    state.currentWorkspace = matched;
                    localStorage.setItem("axora_current_workspace_id", matched._id);
                    localStorage.setItem("axora_current_workspace", JSON.stringify(matched));
                } else if (fetchedList.length > 0) {
                    state.currentWorkspace = fetchedList[0];
                    localStorage.setItem("axora_current_workspace_id", fetchedList[0]._id);
                    localStorage.setItem("axora_current_workspace", JSON.stringify(fetchedList[0]));
                } else {
                    state.currentWorkspace = null;
                    localStorage.removeItem("axora_current_workspace_id");
                    localStorage.removeItem("axora_current_workspace");
                }
            })
            .addCase(fetchWorkspaces.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── fetchWorkspaceDetails ────────────────────────────────────────────
        builder
            .addCase(fetchWorkspaceDetails.fulfilled, (state, action) => {
                if (!action.payload) return;
                const updated = action.payload;
                const idx = state.workspaces.findIndex((w) => w._id === updated._id);
                if (idx !== -1) state.workspaces[idx] = updated;
                if (state.currentWorkspace?._id === updated._id) {
                    state.currentWorkspace = updated;
                    localStorage.setItem("axora_current_workspace", JSON.stringify(updated));
                }
            });

        // ── createWorkspace ──────────────────────────────────────────────────
        builder
            .addCase(createWorkspace.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(createWorkspace.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) {
                    state.workspaces.push(action.payload);
                    state.currentWorkspace = action.payload;
                    localStorage.setItem("axora_current_workspace_id", action.payload._id);
                    localStorage.setItem("axora_current_workspace", JSON.stringify(action.payload));
                }
            })
            .addCase(createWorkspace.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── sendWorkspaceInvite ──────────────────────────────────────────────
        builder
            .addCase(sendWorkspaceInvite.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sendWorkspaceInvite.fulfilled, (state, action) => {
                state.loading = false;
                const updatedWs = action.payload.workspace;
                if (updatedWs) {
                    const idx = state.workspaces.findIndex((w) => w._id === updatedWs._id);
                    if (idx !== -1) state.workspaces[idx] = updatedWs;
                    if (state.currentWorkspace?._id === updatedWs._id) {
                        state.currentWorkspace = updatedWs;
                        localStorage.setItem("axora_current_workspace", JSON.stringify(updatedWs));
                    }
                }
            })
            .addCase(sendWorkspaceInvite.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // ── getInviteDetails ─────────────────────────────────────────────────
        builder
            .addCase(getInviteDetails.pending, (state) => {
                state.inviteLoading = true;
                state.inviteError   = null;
            })
            .addCase(getInviteDetails.fulfilled, (state, action) => {
                state.inviteLoading = false;
                state.activeInvite  = action.payload;
            })
            .addCase(getInviteDetails.rejected, (state, action) => {
                state.inviteLoading = false;
                state.inviteError   = action.payload;
            });

        // ── acceptWorkspaceInvite ────────────────────────────────────────────
        builder
            .addCase(acceptWorkspaceInvite.pending, (state) => {
                state.inviteLoading = true;
                state.inviteError   = null;
            })
            .addCase(acceptWorkspaceInvite.fulfilled, (state, action) => {
                state.inviteLoading = false;
                const newWs = action.payload;
                if (newWs) {
                    const idx = state.workspaces.findIndex((w) => w._id === newWs._id);
                    if (idx !== -1) {
                        state.workspaces[idx] = newWs;
                    } else {
                        state.workspaces.push(newWs);
                    }
                    state.currentWorkspace = newWs;
                    localStorage.setItem("axora_current_workspace_id", newWs._id);
                    localStorage.setItem("axora_current_workspace", JSON.stringify(newWs));
                }
            })
            .addCase(acceptWorkspaceInvite.rejected, (state, action) => {
                state.inviteLoading = false;
                state.inviteError   = action.payload;
            });

        // ── removeWorkspaceMember ────────────────────────────────────────────
        builder
            .addCase(removeWorkspaceMember.pending, (state) => {
                state.membersLoading = true;
            })
            .addCase(removeWorkspaceMember.fulfilled, (state, action) => {
                state.membersLoading = false;
                const { memberId, workspace: updatedWs } = action.payload;
                if (updatedWs) {
                    const idx = state.workspaces.findIndex((w) => w._id === updatedWs._id);
                    if (idx !== -1) state.workspaces[idx] = updatedWs;
                    if (state.currentWorkspace?._id === updatedWs._id) {
                        state.currentWorkspace = updatedWs;
                        localStorage.setItem("axora_current_workspace", JSON.stringify(updatedWs));
                    }
                } else if (state.currentWorkspace?.members) {
                    state.currentWorkspace.members = state.currentWorkspace.members.filter(
                        (m) => m._id !== memberId && (m.user?._id || m.user) !== memberId
                    );
                }
            })
            .addCase(removeWorkspaceMember.rejected, (state, action) => {
                state.membersLoading = false;
                state.error = action.payload;
            });

        // ── updateWorkspaceMemberRole ────────────────────────────────────────
        builder
            .addCase(updateWorkspaceMemberRole.pending, (state) => {
                state.membersLoading = true;
            })
            .addCase(updateWorkspaceMemberRole.fulfilled, (state, action) => {
                state.membersLoading = false;
                const { memberId, role, workspace: updatedWs } = action.payload;
                if (updatedWs) {
                    const idx = state.workspaces.findIndex((w) => w._id === updatedWs._id);
                    if (idx !== -1) state.workspaces[idx] = updatedWs;
                    if (state.currentWorkspace?._id === updatedWs._id) {
                        state.currentWorkspace = updatedWs;
                        localStorage.setItem("axora_current_workspace", JSON.stringify(updatedWs));
                    }
                } else if (state.currentWorkspace?.members) {
                    const target = state.currentWorkspace.members.find(
                        (m) => m._id === memberId || (m.user?._id || m.user) === memberId
                    );
                    if (target) target.role = role;
                }
            })
            .addCase(updateWorkspaceMemberRole.rejected, (state, action) => {
                state.membersLoading = false;
                state.error = action.payload;
            });

        // ── fetchProjects ────────────────────────────────────────────────────
        builder
            .addCase(fetchProjects.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(fetchProjects.fulfilled, (state, action) => {
                state.loading  = false;
                state.projects = action.payload ?? [];
            })
            .addCase(fetchProjects.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── createProject ────────────────────────────────────────────────────
        builder
            .addCase(createProject.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(createProject.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) state.projects.push(action.payload);
            })
            .addCase(createProject.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── deleteProject ────────────────────────────────────────────────────
        builder
            .addCase(deleteProject.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(deleteProject.fulfilled, (state, action) => {
                state.loading  = false;
                state.projects = state.projects.filter(
                    (p) => p._id !== action.payload
                );
            })
            .addCase(deleteProject.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── fetchDashboard ───────────────────────────────────────────────────
        builder
            .addCase(fetchDashboard.pending, (state) => {
                state.dashboardLoading = true;
            })
            .addCase(fetchDashboard.fulfilled, (state, action) => {
                state.dashboardLoading = false;
                state.dashboard        = action.payload;
            })
            .addCase(fetchDashboard.rejected, (state) => {
                state.dashboardLoading = false;
            })
            .addCase("auth/logout", (state) => {
                state.workspaces       = [];
                state.currentWorkspace = null;
                state.projects         = [];
                state.dashboard        = null;
                state.loading          = false;
                state.error            = null;
                state.activeInvite     = null;
                state.inviteLoading    = false;
                state.inviteError      = null;
                state.membersLoading   = false;
            });
    },
});

export const {
    setCurrentWorkspace,
    clearWorkspaceError,
    clearActiveInvite,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
