const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                role: {
                    type: String,
                    enum: ["owner", "admin", "member", "viewer"],
                    default: "member",
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        invitations: [
            {
                email: {
                    type: String,
                    required: true,
                    lowercase: true,
                    trim: true,
                },
                role: {
                    type: String,
                    enum: ["admin", "member", "viewer"],
                    default: "member",
                },
                token: {
                    type: String,
                    required: true,
                },
                expiresAt: {
                    type: Date,
                    required: true,
                },
                invitedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;
