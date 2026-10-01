import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// ── Helpers ──────────────────────────────────────────────────────
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

// ── Async Thunks ─────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
    "auth/registerUser",
    async ({ name, email, password }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/register", { name, email, password });
            return { email, ...data.data };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Something went wrong"
            );
        }
    }
);

export const verifyOTP = createAsyncThunk(
    "auth/verifyOTP",
    async ({ email, otp }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/verify-otp", { email, otp });
            localStorage.setItem("axora_token", data.data.token);
            localStorage.setItem("axora_user", JSON.stringify(data.data));
            return data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Invalid or expired OTP"
            );
        }
    }
);

export const resendOTP = createAsyncThunk(
    "auth/resendOTP",
    async ({ email }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/resend-otp", { email });
            return data.message;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to resend OTP"
            );
        }
    }
);

export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });
            localStorage.setItem("axora_token", data.data.token);
            localStorage.setItem("axora_user", JSON.stringify(data.data));
            return data.data;
        } catch (error) {
            const res = error.response?.data;
            if (res?.requiresVerification) {
                return rejectWithValue({
                    message: res.message,
                    requiresVerification: true,
                    email: res.email,
                });
            }
            return rejectWithValue(res?.message || "Something went wrong");
        }
    }
);

export const forgotPassword = createAsyncThunk(
    "auth/forgotPassword",
    async ({ email }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/forgot-password", { email });
            return { message: data.message, email };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Something went wrong"
            );
        }
    }
);

export const resetPassword = createAsyncThunk(
    "auth/resetPassword",
    async ({ email, otp, newPassword }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/auth/reset-password", { email, otp, newPassword });
            return data.message;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Something went wrong"
            );
        }
    }
);

// ── Slice ────────────────────────────────────────────────────────

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user:                  storedUser,
        token:                 storedToken,
        isAuthenticated:       Boolean(storedToken),
        loading:               false,
        error:                 null,
        pendingEmail:          null,
        requiresVerification:  false,
        otpSent:               false,
        resetEmailSent:        false,
        resetSuccess:          false,
        successMessage:        null,
    },
    reducers: {
        logout(state) {
            state.user                 = null;
            state.token                = null;
            state.isAuthenticated      = false;
            state.loading              = false;
            state.error                = null;
            state.pendingEmail         = null;
            state.requiresVerification = false;
            state.otpSent              = false;
            state.resetEmailSent       = false;
            state.resetSuccess         = false;
            state.successMessage       = null;
            localStorage.removeItem("axora_token");
            localStorage.removeItem("axora_user");
            localStorage.removeItem("axora_current_workspace_id");
            localStorage.removeItem("axora_current_workspace");
        },
        clearError(state) {
            state.error = null;
        },
        clearAuthFlow(state) {
            state.pendingEmail         = null;
            state.requiresVerification = false;
            state.otpSent              = false;
            state.resetEmailSent       = false;
            state.resetSuccess         = false;
            state.successMessage       = null;
            state.error                = null;
        },
        setPendingEmail(state, action) {
            state.pendingEmail = action.payload;
        },
    },
    extraReducers: (builder) => {
        // registerUser
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading      = false;
                state.otpSent      = true;
                state.pendingEmail = action.payload.email;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // verifyOTP
        builder
            .addCase(verifyOTP.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(verifyOTP.fulfilled, (state, action) => {
                state.loading              = false;
                state.user                 = action.payload;
                state.token                = action.payload.token;
                state.isAuthenticated      = true;
                state.pendingEmail         = null;
                state.requiresVerification = false;
                state.otpSent              = false;
            })
            .addCase(verifyOTP.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // resendOTP
        builder
            .addCase(resendOTP.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(resendOTP.fulfilled, (state, action) => {
                state.loading        = false;
                state.successMessage = action.payload;
            })
            .addCase(resendOTP.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // loginUser
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
                if (typeof action.payload === "object" && action.payload?.requiresVerification) {
                    state.error                = action.payload.message;
                    state.requiresVerification = true;
                    state.pendingEmail         = action.payload.email;
                } else {
                    state.error = action.payload;
                }
            });

        // forgotPassword
        builder
            .addCase(forgotPassword.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(forgotPassword.fulfilled, (state, action) => {
                state.loading        = false;
                state.resetEmailSent = true;
                state.pendingEmail   = action.payload.email;
                state.successMessage = action.payload.message;
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // resetPassword
        builder
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(resetPassword.fulfilled, (state, action) => {
                state.loading        = false;
                state.resetSuccess   = true;
                state.successMessage = action.payload;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });
    },
});

export const { logout, clearError, clearAuthFlow, setPendingEmail } = authSlice.actions;
export default authSlice.reducer;
