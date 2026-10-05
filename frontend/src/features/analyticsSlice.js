import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

const extractError = (error) =>
    error.response?.data?.message || error.message || "Failed to fetch analytics";

export const fetchWorkspaceAnalytics = createAsyncThunk(
    "analytics/fetchWorkspaceAnalytics",
    async ({ workspaceId, days = 14 }, { rejectWithValue }) => {
        try {
            const daysParam = days === "all" ? "all" : days;
            const res = await api.get(`/analytics/workspace/${workspaceId}?days=${daysParam}`);
            return res.data?.data || res.data;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

const analyticsSlice = createSlice({
    name: "analytics",
    initialState: {
        data: null,
        loading: false,
        error: null,
        timeRange: 14,
    },
    reducers: {
        setTimeRange: (state, action) => {
            state.timeRange = action.payload;
        },
        clearAnalytics: (state) => {
            state.data = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkspaceAnalytics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWorkspaceAnalytics.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
                state.error = null;
            })
            .addCase(fetchWorkspaceAnalytics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setTimeRange, clearAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
