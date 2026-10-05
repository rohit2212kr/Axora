const express = require("express");
const cors    = require("cors");
const authRoutes      = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const projectRoutes   = require("./routes/projectRoutes");
const taskRoutes      = require("./routes/taskRoutes");
const aiRoutes        = require("./routes/ai.routes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "https://axoraa-gray.vercel.app",
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // Allow explicit list, any localhost, or any *.vercel.app domain
        const isAllowed =
            allowedOrigins.includes(origin) ||
            origin.endsWith(".vercel.app") ||
            origin.startsWith("http://localhost:");

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error("Blocked by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
try {
    app.options("*", cors(corsOptions));
} catch {
    // Express 5 + path-to-regexp v8 compatibility
    app.options(/(.*)/, cors(corsOptions));
}

app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(["/api/v1/auth", "/api/auth", "/v1/auth"], authRoutes);
app.use(["/api/v1/workspaces", "/api/workspaces", "/v1/workspaces"], workspaceRoutes);
app.use(
    [
        "/api/v1/workspaces/:workspaceId/projects",
        "/api/workspaces/:workspaceId/projects",
        "/v1/workspaces/:workspaceId/projects",
    ],
    projectRoutes
);
app.use(["/api/v1/tasks", "/api/tasks", "/v1/tasks"], taskRoutes);
app.use(["/api/v1/analytics", "/api/analytics", "/v1/analytics"], analyticsRoutes);
app.use(["/api/v1", "/api", "/v1"], aiRoutes);

module.exports = app;
