import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ProtectedRoute   from "./components/ProtectedRoute";
import AppLayout        from "./components/AppLayout";
import LandingPage      from "./pages/LandingPage";
import Login            from "./pages/Login";
import Signup           from "./pages/Signup";
import VerifyOTP        from "./pages/VerifyOTP";
import ForgotPassword   from "./pages/ForgotPassword";
import ResetPassword    from "./pages/ResetPassword";
import Dashboard        from "./pages/Dashboard";
import Projects         from "./pages/Projects";
import ProjectBoard     from "./pages/ProjectBoard";
import InviteAcceptPage from "./pages/InviteAcceptPage";
import AnalyticsPage    from "./pages/AnalyticsPage";

const RootRoute = () => {
    const { isAuthenticated } = useSelector((s) => s.auth);
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }
    return <LandingPage />;
};

const App = () => (
    <BrowserRouter>
        <Routes>
            {/* Public landing page / redirect */}
            <Route path="/" element={<RootRoute />} />

            {/* Public auth */}
            <Route path="/login"           element={<Login />} />
            <Route path="/signup"          element={<Signup />} />
            <Route path="/verify-otp"      element={<VerifyOTP />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* Public invitation accept page */}
            <Route path="/invite/:token"   element={<InviteAcceptPage />} />

            {/* Protected - all children share the AppLayout shell */}
            <Route
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard"           element={<Dashboard />} />
                <Route path="/projects"            element={<Projects />} />
                <Route path="/projects/:projectId" element={<ProjectBoard />} />
                <Route path="/analytics"           element={<AnalyticsPage />} />
                <Route path="/workspace/:workspaceId/analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
);

export default App;
