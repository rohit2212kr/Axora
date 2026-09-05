import axios from "axios";

// Central Axios instance — all API calls go through this
const axiosInstance = axios.create({
    baseURL: "http://localhost:5000/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Attach the JWT token to every outgoing request if one exists in localStorage
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("axora_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
// Pass through successful responses; handle 401 by clearing session and
// redirecting to /login so the user is not silently stuck on a broken page.
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear stored credentials
            localStorage.removeItem("axora_token");
            localStorage.removeItem("axora_user");

            // Redirect to login only if not already there (prevents redirect loop)
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
