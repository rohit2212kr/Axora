require("dotenv").config(); // Must be first — loads env vars before anything else reads them

const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket, emitToProject } = require("./src/socket/socketHandler");

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// Attach io and helper to Express app instance
app.set("io", io);
app.set("emitToProject", emitToProject);

// Render (and most PaaS) requires binding to 0.0.0.0, not just localhost
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});