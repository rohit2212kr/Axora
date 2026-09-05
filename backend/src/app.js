const express = require('express');
const cors = require('cors');
const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const projectRoutes = require("./routes/projectRoutes");





const app = express();

// CORS — must be registered before all routes so preflight OPTIONS requests
// are handled correctly and the Authorization header is allowed through
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/workspaces/:workspaceId/projects", projectRoutes);

module.exports = app;