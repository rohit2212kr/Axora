const Workspace = require("../models/Workspace");

/**
 * RBAC middleware — verifies that the authenticated user holds one of the
 * `allowedRoles` inside the target workspace before forwarding the request.
 *
 * Usage:  router.post("/route", protect, verifyWorkspaceRole(["owner", "admin"]), controller)
 *
 * @param {string[]} allowedRoles - Array of roles permitted to access the route
 *                                  (case-insensitive, e.g. ["Owner", "Admin"])
 */
const verifyWorkspaceRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Normalize roles to lowercase for consistent comparison
            const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

            // Support workspaceId from route params (preferred) or body — safe on undefined objects
            const workspaceId = req.params?.workspaceId || req.body?.workspaceId;

            // Edge Case 1: workspaceId missing or empty
            if (!workspaceId) {
                return res.status(400).json({
                    success: false,
                    message: "Workspace ID is required",
                });
            }

            // Fetch workspace (lean for performance; we only need to inspect fields)
            const workspace = await Workspace.findById(workspaceId);

            // Edge Case 2: Workspace does not exist
            if (!workspace) {
                return res.status(404).json({
                    success: false,
                    message: "Workspace not found",
                });
            }

            const requestingUserId = req.user._id.toString();

            // Owner shortcut — the createdBy user always has full access
            if (workspace.createdBy.toString() === requestingUserId) {
                return next();
            }

            // Locate the requesting user inside the members array
            const memberEntry = workspace.members.find(
                (m) => m.user.toString() === requestingUserId
            );

            // Edge Case 3: User is not a member, or their role is not in allowedRoles
            if (!memberEntry || !normalizedAllowedRoles.includes(memberEntry.role.toLowerCase())) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied: Insufficient permissions in this workspace",
                });
            }

            // User passes — proceed to the next middleware / controller
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Server error during role verification",
                error: error.message,
            });
        }
    };
};

module.exports = { verifyWorkspaceRole };
