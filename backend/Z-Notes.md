Day1: created user schema for DB

Day 2: Connected MongoDB, created signup & login APIs with Bcrypt hashing, generated JWT tokens, and built auth middleware for private routes.

Day 3: Created Workspace Schema and built the Create Workspace API. Handled multi-user logic (ObjectId mapping) and integrated Mongoose .populate() to safely return creator and member details (name & email) to the frontend without leaking passwords.

Day 4: Built verifyWorkspaceRole middleware for RBAC checks and implemented the Invite Member API with email lookups, duplicate checks, and role assignments.

Day 5: Created Project schema and refactored REST architecture to nested routes (/workspaces/:workspaceId/projects) using Express mergeParams. Built Create Project and Get Projects APIs with populated user data.

Day 6: Created Task schema with priority, status, and due dates. Built nested task APIs (/projects/:projectId/tasks) with permission guards restricting self-assignment for members and verifying project membership.

Day 7: Implemented task update and delete endpoints with granular RBAC enforcement. Members can only update their own assigned tasks, while Admins/Owners retain full re-assignment and deletion rights.

Day 8: Created GET /kanban endpoint returning tasks pre-grouped into todo, in_progress, in_review, and completed columns for board UI rendering. Added strict status transition validation on update task API.