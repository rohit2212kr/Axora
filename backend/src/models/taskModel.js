const mongoose = require("mongoose");

// Embedded subtask schema — each AI-generated step lives here
const subtaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        isCompleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        status: {
            type: String,
            enum: ["todo", "in_progress", "in_review", "completed"],
            default: "todo",
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },

        dueDate: {
            type: Date,
            required: true,
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },

        workspace: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // AI-generated breakdown steps — embedded documents
        subtasks: {
            type: [subtaskSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Task", taskSchema);
