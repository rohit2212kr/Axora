import { configureStore } from "@reduxjs/toolkit";
import authReducer      from "../features/authSlice";
import workspaceReducer from "../features/workspaceSlice";
import taskReducer      from "../features/taskSlice";

const store = configureStore({
    reducer: {
        auth:      authReducer,
        workspace: workspaceReducer,
        task:      taskReducer,
    },
});

export default store;
