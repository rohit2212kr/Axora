const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Protect routes - Authentication middleware
 * Verifies JWT token and attaches user to request object
 * @access Private routes only
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Check if Authorization header exists and starts with "Bearer"
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            // Extract token from "Bearer <token>"
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token payload and attach to request (excluding password)
            req.user = await User.findById(decoded.id).select("-password");

            // Pass control to next middleware/controller
            next();
        } else {
            // Edge Case 1: No token or invalid format
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token provided",
            });
        }
    } catch (error) {
        // Edge Case 2: Token verification failed (invalid, expired, malformed)
        return res.status(401).json({
            success: false,
            message: "Not authorized, token failed",
        });
    }
};

module.exports = { protect };
