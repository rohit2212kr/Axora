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

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, server-to-server, curl, mobile)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Return false — NOT an Error — so the browser gets a proper CORS
            // rejection (403) instead of an unhandled 500 on preflight OPTIONS.
            callback(null, false);
        }
    },
    credentials:    true,
    methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

// app.use(cors()) without a path applies to ALL requests — including OPTIONS preflight.
// The cors middleware short-circuits OPTIONS requests automatically (returns 204 with
// correct headers) when preflightContinue is false (the default). A separate
// app.options() wildcard is redundant and breaks under Express 5 + path-to-regexp v8.
app.use(cors(corsOptions));


app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth",                             authRoutes);
app.use("/api/v1/workspaces",                       workspaceRoutes);
app.use("/api/v1/workspaces/:workspaceId/projects", projectRoutes);

module.exports = app;
