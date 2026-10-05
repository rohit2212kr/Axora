import { configureStore } from "@reduxjs/toolkit";
import authReducer      from "../features/authSlice";
import workspaceReducer from "../features/workspaceSlice";
import taskReducer      from "../features/taskSlice";
import analyticsReducer from "../features/analyticsSlice";

const store = configureStore({
    reducer: {
        auth:      authReducer,
        workspace: workspaceReducer,
        task:      taskReducer,
        analytics: analyticsReducer,
    },
});

export default store;
