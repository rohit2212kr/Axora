import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout      from "./components/AppLayout";
import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import Dashboard      from "./pages/Dashboard";
import Projects       from "./pages/Projects";
import ProjectBoard   from "./pages/ProjectBoard";

const App = () => (
    <BrowserRouter>
        <Routes>

            {/* Public */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected — all children share the AppLayout shell */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route index                         element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard"              element={<Dashboard />} />
                <Route path="projects"               element={<Projects />} />
                <Route path="projects/:projectId"    element={<ProjectBoard />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </BrowserRouter>
);

export default App;
