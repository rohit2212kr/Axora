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
        estimatedMinutes: {
            type: Number,
            default: 30,
        },
    },
    {
        timestamps: true,
    }
);

// Label sub-schema
const labelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Label name is required"],
            trim: true,
            maxlength: [30, "Label name cannot exceed 30 characters"],
        },
        color: {
            type: String,
            default: "#6366f1",
            match: [/^#([0-9A-F]{3}){1,2}$/i, "Please provide a valid hex color"],
        },
    },
    { _id: false }
);

// Comment sub-schema
const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Comment author is required"],
        },
        text: {
            type: String,
            required: [true, "Comment text is required"],
            trim: true,
            maxlength: [2000, "Comment cannot exceed 2000 characters"],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
        },
    },
    {
        _id: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual alias author -> user for flexibility
commentSchema.virtual("author").get(function () {
    return this.user;
});

// Activity log sub-schema
const activityLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Activity actor is required"],
        },
        action: {
            type: String,
            required: [true, "Activity action is required"],
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, "Activity details are required"],
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual alias actor -> user for flexibility
activityLogSchema.virtual("actor").get(function () {
    return this.user;
});

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

        // Categorization labels / tags
        labels: {
            type: [labelSchema],
            default: [],
        },

        // Threaded comments
        comments: {
            type: [commentSchema],
            default: [],
        },

        // Audit activity log
        activity: {
            type: [activityLogSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

module.exports = mongoose.models.Task || mongoose.model("Task", taskSchema);
