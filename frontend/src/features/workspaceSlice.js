import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// ─── Helper ──────────────────────────────────────────────────────────────────
const extractError = (error) =>
    error.response?.data?.message || error.message || "Something went wrong";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/** Fetch all workspaces the authenticated user belongs to */
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

/** Fetch all projects in a workspace
 *  Backend route: GET /workspaces/:workspaceId/projects
 */
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

/** Create a new project in a workspace
 *  Backend route: POST /workspaces/:workspaceId/projects
 */
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

/** Delete a project
 *  Backend route: DELETE /workspaces/:workspaceId/projects/:projectId
 */
export const deleteProject = createAsyncThunk(
    "workspace/deleteProject",
    async ({ workspaceId, projectId }, { rejectWithValue }) => {
        try {
            await api.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
            return projectId; // return id so we can filter it out of state
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const workspaceSlice = createSlice({
    name: "workspace",
    initialState: {
        workspaces:        [],
        currentWorkspace:  null,
        projects:          [],
        loading:           false,
        error:             null,
    },
    reducers: {
        setCurrentWorkspace(state, action) {
            state.currentWorkspace = action.payload;
        },
        clearWorkspaceError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {

        // ── fetchWorkspaces ────────────────────────────────────────────────
        builder
            .addCase(fetchWorkspaces.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(fetchWorkspaces.fulfilled, (state, action) => {
                state.loading    = false;
                state.workspaces = action.payload ?? [];
                // Auto-select first workspace if none is currently selected
                if (!state.currentWorkspace && action.payload?.length > 0) {
                    state.currentWorkspace = action.payload[0];
                }
            })
            .addCase(fetchWorkspaces.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── createWorkspace ────────────────────────────────────────────────
        builder
            .addCase(createWorkspace.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(createWorkspace.fulfilled, (state, action) => {
                state.loading = false;
                state.workspaces.push(action.payload);
                state.currentWorkspace = action.payload;
            })
            .addCase(createWorkspace.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── inviteMember ───────────────────────────────────────────────────
        builder
            .addCase(inviteMember.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(inviteMember.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(inviteMember.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── fetchProjects ──────────────────────────────────────────────────
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

        // ── createProject ──────────────────────────────────────────────────
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

        // ── deleteProject ──────────────────────────────────────────────────
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
    },
});

export const { setCurrentWorkspace, clearWorkspaceError } = workspaceSlice.actions;
export default workspaceSlice.reducer;
