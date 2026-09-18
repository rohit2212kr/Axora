import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Safely parse localStorage so a corrupt JSON value never crashes the app
const safeParseJSON = (key) => {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
};

const storedToken = localStorage.getItem("axora_token") || null;
const storedUser  = safeParseJSON("axora_user");

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });
            // Persist session
            localStorage.setItem("axora_token", data.data.token);
            localStorage.setItem("axora_user", JSON.stringify(data.data));
            return data.data; // { _id, name, email, token }
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Something went wrong"
            );
        }
    }
);

export const registerUser = createAsyncThunk(
    "auth/registerUser",
    async ({ name, email, password }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/register", { name, email, password });
            // Persist session
            localStorage.setItem("axora_token", data.data.token);
            localStorage.setItem("axora_user", JSON.stringify(data.data));
            return data.data; // { _id, name, email, token }
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Something went wrong"
            );
        }
    }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user:            storedUser,
        token:           storedToken,
        isAuthenticated: Boolean(storedToken),
        loading:         false,
        error:           null,
    },
    reducers: {
        logout(state) {
            state.user            = null;
            state.token           = null;
            state.isAuthenticated = false;
            state.loading         = false;
            state.error           = null;
            localStorage.removeItem("axora_token");
            localStorage.removeItem("axora_user");
            localStorage.removeItem("axora_current_workspace_id");
            localStorage.removeItem("axora_current_workspace");
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // ── loginUser ──
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading         = false;
                state.user            = action.payload;
                state.token           = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── registerUser ──
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading         = false;
                state.user            = action.payload;
                state.token           = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
