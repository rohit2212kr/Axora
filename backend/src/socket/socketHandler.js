const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

let io = null;

// Map<projectId, Map<userId, { user: { _id, name, email }, count: number, socketIds: Set<string> }>>
const projectRooms = new Map();

/**
 * Emit current presence list to a project room
 * @param {string} projectId
 */
const emitPresenceSync = (projectId) => {
    if (!io || !projectId) return;
    const roomUsers = projectRooms.get(projectId.toString());
    const activeUsers = roomUsers
        ? Array.from(roomUsers.values()).map((entry) => entry.user)
        : [];

    io.to(`project:${projectId}`).emit("presence:sync", {
        projectId: projectId.toString(),
        activeUsers,
    });
};

/**
 * Handle user leaving a project room
 * @param {string} projectId
 * @param {string} userId
 * @param {string} socketId
 */
const handleUserLeaveProject = (projectId, userId, socketId) => {
    if (!projectId || !userId) return;
    const pId = projectId.toString();
    const roomUsers = projectRooms.get(pId);
    if (!roomUsers) return;

    if (roomUsers.has(userId)) {
        const entry = roomUsers.get(userId);
        entry.socketIds.delete(socketId);
        entry.count -= 1;

        if (entry.count <= 0 || entry.socketIds.size === 0) {
            roomUsers.delete(userId);
        }
    }

    if (roomUsers.size === 0) {
        projectRooms.delete(pId);
    }

    emitPresenceSync(pId);
};

/**
 * Initialize Socket.io server
 * @param {http.Server} server
 * @returns {Server}
 */
const initSocket = (server) => {
    const allowedOrigins = [
        process.env.CLIENT_URL,
        "http://localhost:5173",
    ].filter(Boolean);

    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(null, false);
                }
            },
            credentials: true,
            methods: ["GET", "POST"],
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // JWT Handshake Authentication Middleware
    io.use(async (socket, next) => {
        try {
            let token = socket.handshake.auth?.token;
            if (!token && socket.handshake.headers?.authorization) {
                const authHeader = socket.handshake.headers.authorization;
                if (authHeader.startsWith("Bearer ")) {
                    token = authHeader.split(" ")[1];
                } else {
                    token = authHeader;
                }
            }

            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("name email");

            if (!user) {
                return next(new Error("Authentication error: User not found"));
            }

            socket.user = {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
            };
            next();
        } catch (err) {
            return next(new Error("Authentication error: Invalid or expired token"));
        }
    });

    // Socket Connection Management
    io.on("connection", (socket) => {
        socket.joinedProjects = new Set();

        // Join Project Room
        socket.on("join:project", (projectId) => {
            if (!projectId) return;
            const pId = projectId.toString();
            const roomName = `project:${pId}`;

            socket.join(roomName);
            socket.joinedProjects.add(pId);

            if (!projectRooms.has(pId)) {
                projectRooms.set(pId, new Map());
            }

            const roomUsers = projectRooms.get(pId);
            const userId = socket.user._id;

            if (roomUsers.has(userId)) {
                const entry = roomUsers.get(userId);
                entry.count += 1;
                entry.socketIds.add(socket.id);
            } else {
                roomUsers.set(userId, {
                    user: socket.user,
                    count: 1,
                    socketIds: new Set([socket.id]),
                });
            }

            emitPresenceSync(pId);
        });

        // Leave Project Room
        socket.on("leave:project", (projectId) => {
            if (!projectId) return;
            const pId = projectId.toString();
            const roomName = `project:${pId}`;

            socket.leave(roomName);
            socket.joinedProjects.delete(pId);
            handleUserLeaveProject(pId, socket.user._id, socket.id);
        });

        // Typing indicators or custom room broadcasts can be added here
        socket.on("task:typing", ({ projectId, taskId, isTyping }) => {
            if (!projectId) return;
            socket.to(`project:${projectId}`).emit("task:typing", {
                taskId,
                user: socket.user,
                isTyping,
            });
        });

        // Handle Disconnect
        socket.on("disconnect", () => {
            if (socket.joinedProjects) {
                for (const pId of socket.joinedProjects) {
                    handleUserLeaveProject(pId, socket.user._id, socket.id);
                }
            }
        });
    });

    return io;
};

/**
 * Get active io instance
 * @returns {Server}
 */
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io has not been initialized!");
    }
    return io;
};

/**
 * Broadcast event to all sockets in a project room
 * @param {string} projectId
 * @param {string} event
 * @param {any} data
 */
const emitToProject = (projectId, event, data) => {
    if (!io || !projectId) return;
    io.to(`project:${projectId.toString()}`).emit(event, data);
};

module.exports = {
    initSocket,
    getIO,
    emitToProject,
};
