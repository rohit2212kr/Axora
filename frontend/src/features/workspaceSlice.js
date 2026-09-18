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

/** Invite a member to a workspace (Owner / Admin only) */
export const inviteMember = createAsyncThunk(
    "workspace/inviteMember",
    async ({ workspaceId, email, role }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/workspaces/invite", {
                workspaceId,
                email,
                role,
            });
            return data.workspace;
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

/** Create a new project in a workspace */
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
                state.workspaces = [];
                state.currentWorkspace = null;
                state.projects = [];
                state.dashboard = null;
                state.loading = false;
                state.error = null;
            });
    },
});

export const { setCurrentWorkspace, clearWorkspaceError } = workspaceSlice.actions;
export default workspaceSlice.reducer;
