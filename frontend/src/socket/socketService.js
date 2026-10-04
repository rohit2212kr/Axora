import { io } from "socket.io-client";

let socket = null;
let currentToken = null;

/**
 * Resolves the Socket.IO server URL based on Vite environment variables.
 */
const resolveSocketURL = () => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    if (socketUrl) return socketUrl;

    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
        // Strip trailing /api/v1 and slashes
        return apiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
    }

    return "http://localhost:5000";
};

/**
 * Get the current socket instance
 */
export const getSocket = () => socket;

/**
 * Connect to the Socket.IO server using the provided token or stored token
 * @param {string} [token]
 * @returns {Socket|null}
 */
export const connectSocket = (token) => {
    const authToken = token || localStorage.getItem("axora_token");

    if (!authToken) {
        if (socket) {
            socket.disconnect();
            socket = null;
            currentToken = null;
        }
        return null;
    }

    // If socket exists with the same token and is connected, reuse it
    if (socket && currentToken === authToken && (socket.connected || socket.connecting)) {
        return socket;
    }

    // If token changed or socket disconnected, tear down previous
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    currentToken = authToken;
    const socketURL = resolveSocketURL();

    socket = io(socketURL, {
        auth: { token: authToken },
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
    });

    socket.on("connect", () => {
        console.log("[Socket] Connected to collaboration server:", socket.id);
    });

    socket.on("connect_error", (error) => {
        console.warn("[Socket] Real-time connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected from server:", reason);
    });

    return socket;
};

/**
 * Disconnect socket and clean up
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentToken = null;
    }
};

/**
 * Join a project room for real-time board updates & presence
 * @param {string} projectId
 */
export const joinProject = (projectId) => {
    if (!projectId) return;
    const s = socket?.connected ? socket : connectSocket();
    if (s) {
        s.emit("join:project", projectId);
    }
};

/**
 * Leave a project room
 * @param {string} projectId
 */
export const leaveProject = (projectId) => {
    if (!projectId || !socket) return;
    socket.emit("leave:project", projectId);
};

export default {
    getSocket,
    connectSocket,
    disconnectSocket,
    joinProject,
    leaveProject,
};
