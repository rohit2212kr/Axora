const express = require("express");
const cors    = require("cors");
const authRoutes      = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const projectRoutes   = require("./routes/projectRoutes");

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Accepts CLIENT_URL from env (set to the Vercel URL in production).
// Falls back to localhost:5173 so local dev works without any .env change.
const allowedOrigins = [
    process.env.CLIENT_URL,     // e.g. https://axora.vercel.app  (set in Render dashboard)
    "http://localhost:5173",    // Vite dev server
].filter(Boolean);             // strips undefined if CLIENT_URL is not set

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, server-to-server, curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: origin '${origin}' is not allowed`));
        }
    },
    credentials:    true,
    methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth",                             authRoutes);
app.use("/api/v1/workspaces",                       workspaceRoutes);
app.use("/api/v1/workspaces/:workspaceId/projects", projectRoutes);

module.exports = app;
