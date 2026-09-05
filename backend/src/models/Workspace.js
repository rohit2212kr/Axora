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
                    enum: ["owner", "admin", "member"],
                    default: "member",
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
