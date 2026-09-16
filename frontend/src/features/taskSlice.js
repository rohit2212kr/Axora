import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/axios";

// ─── Helper ──────────────────────────────────────────────────────────────────
const extractError = (error) =>
    error.response?.data?.message || error.message || "Something went wrong";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

/**
 * Fetch all tasks for a project.
 * payload: { workspaceId, projectId }
 */
export const fetchTasks = createAsyncThunk(
    "task/fetchTasks",
    async ({ workspaceId, projectId }, { rejectWithValue }) => {
        try {
            const { data } = await api.get(
                `/workspaces/${workspaceId}/projects/${projectId}/tasks`
            );
            return data.tasks;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/**
 * Create a new task inside a project.
 * payload: { workspaceId, projectId, title, description, status, priority, dueDate, assignedTo? }
 */
export const createTask = createAsyncThunk(
    "task/createTask",
    async ({ workspaceId, projectId, title, description, status, priority, dueDate, assignedTo }, { rejectWithValue }) => {
        try {
            const { data } = await api.post(
                `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
                { title, description, status, priority, dueDate, assignedTo }
            );
            return data.task;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/**
 * Update a task's status (or any field via PUT).
 * payload: { workspaceId, projectId, taskId, status, ...otherFields }
 */
export const updateTaskStatus = createAsyncThunk(
    "task/updateTaskStatus",
    async ({ workspaceId, projectId, taskId, ...fields }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(
                `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
                fields
            );
            return data.task;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/**
 * Trigger AI breakdown for a task.
 * payload: { workspaceId, projectId, taskId }
 */
export const breakdownTaskWithAI = createAsyncThunk(
    "task/breakdownTaskWithAI",
    async ({ workspaceId, projectId, taskId }, { rejectWithValue }) => {
        try {
            const { data } = await api.post(
                `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/breakdown`
            );
            return data.task;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/**
 * Toggle a subtask's isCompleted status and persist to backend.
 * payload: { workspaceId, projectId, taskId, subtaskId, isCompleted }
 */
export const toggleSubtask = createAsyncThunk(
    "task/toggleSubtask",
    async ({ workspaceId, projectId, taskId, subtaskId, isCompleted }, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const currentTask = state.task.tasks.find((t) => t._id === taskId);
            if (!currentTask) throw new Error("Task not found");

            const updatedSubtasks = (currentTask.subtasks || []).map((st) =>
                st._id === subtaskId ? { ...st, isCompleted } : st
            );

            const { data } = await api.put(
                `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
                { subtasks: updatedSubtasks }
            );
            return data.task;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

/**
 * Delete a task.
 * payload: { workspaceId, projectId, taskId }
 */
export const deleteTask = createAsyncThunk(
    "task/deleteTask",
    async ({ workspaceId, projectId, taskId }, { rejectWithValue }) => {
        try {
            await api.delete(
                `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
            );
            return taskId;
        } catch (error) {
            return rejectWithValue(extractError(error));
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const taskSlice = createSlice({
    name: "task",
    initialState: {
        tasks:              [],
        loading:            false,
        aiLoading:          false,
        aiGeneratingTaskId: null,
        error:              null,
        aiError:            null,
    },
    reducers: {
        clearTaskError(state) {
            state.error = null;
        },
        clearAiError(state) {
            state.aiError = null;
        },
        clearTasks(state) {
            state.tasks              = [];
            state.error              = null;
            state.aiError            = null;
            state.loading            = false;
            state.aiLoading          = false;
            state.aiGeneratingTaskId = null;
        },
    },
    extraReducers: (builder) => {

        // ── fetchTasks ─────────────────────────────────────────────────────
        builder
            .addCase(fetchTasks.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks   = action.payload ?? [];
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── createTask ─────────────────────────────────────────────────────
        builder
            .addCase(createTask.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(createTask.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload) state.tasks.push(action.payload);
            })
            .addCase(createTask.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── updateTaskStatus ───────────────────────────────────────────────
        builder
            .addCase(updateTaskStatus.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(updateTaskStatus.fulfilled, (state, action) => {
                state.loading = false;
                const updated = action.payload;
                if (!updated) return;
                const idx = state.tasks.findIndex((t) => t._id === updated._id);
                if (idx !== -1) state.tasks[idx] = updated;
            })
            .addCase(updateTaskStatus.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });

        // ── breakdownTaskWithAI ────────────────────────────────────────────
        builder
            .addCase(breakdownTaskWithAI.pending, (state, action) => {
                state.aiLoading          = true;
                state.aiGeneratingTaskId = action.meta.arg.taskId;
                state.aiError            = null;
            })
            .addCase(breakdownTaskWithAI.fulfilled, (state, action) => {
                state.aiLoading          = false;
                state.aiGeneratingTaskId = null;
                const updated = action.payload;
                if (!updated) return;
                const idx = state.tasks.findIndex((t) => t._id === updated._id);
                if (idx !== -1) state.tasks[idx] = updated;
            })
            .addCase(breakdownTaskWithAI.rejected, (state, action) => {
                state.aiLoading          = false;
                state.aiGeneratingTaskId = null;
                state.aiError            = action.payload;
            });

        // ── toggleSubtask ──────────────────────────────────────────────────
        builder
            .addCase(toggleSubtask.fulfilled, (state, action) => {
                const updated = action.payload;
                if (!updated) return;
                const idx = state.tasks.findIndex((t) => t._id === updated._id);
                if (idx !== -1) state.tasks[idx] = updated;
            });

        // ── deleteTask ─────────────────────────────────────────────────────
        builder
            .addCase(deleteTask.pending, (state) => {
                state.loading = true;
                state.error   = null;
            })
            .addCase(deleteTask.fulfilled, (state, action) => {
                state.loading = false;
                state.tasks   = state.tasks.filter((t) => t._id !== action.payload);
            })
            .addCase(deleteTask.rejected, (state, action) => {
                state.loading = false;
                state.error   = action.payload;
            });
    },
});

export const { clearTaskError, clearAiError, clearTasks } = taskSlice.actions;
export default taskSlice.reducer;
