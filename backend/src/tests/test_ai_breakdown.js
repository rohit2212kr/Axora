require("dotenv").config();
const mongoose = require("mongoose");
const Task = require("../models/task.model");
const { breakdownTask } = require("../controllers/ai.controller");

async function runTest() {
    console.log("=== Testing AI Task Breakdown ===");

    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB successfully.");

    try {
        // 2. Find any existing task, or create a mock task
        let task = await Task.findOne();
        let createdMock = false;

        if (!task) {
            const fakeId = new mongoose.Types.ObjectId();
            task = await Task.create({
                title: "Build Authentication System with JWT and Refresh Tokens",
                description: "Implement secure user registration, login, token refresh rotation, and password hashing with bcrypt.",
                dueDate: new Date(Date.now() + 86400000 * 7),
                project: fakeId,
                workspace: fakeId,
                createdBy: fakeId,
            });
            createdMock = true;
            console.log("Created temporary test task:", task._id);
        } else {
            console.log("Using existing task for test:", task._id, `("${task.title}")`);
        }

        // 3. Mock Express req and res objects
        const req = {
            params: {
                workspaceId: task.workspace.toString(),
                projectId: task.project.toString(),
                taskId: task._id.toString(),
            },
        };

        let statusCode = null;
        let responseBody = null;

        const res = {
            status: function(code) {
                statusCode = code;
                return this;
            },
            json: function(data) {
                responseBody = data;
                return this;
            },
        };

        // 4. Execute breakdownTask controller
        console.log("Calling breakdownTask controller...");
        await breakdownTask(req, res);

        console.log("Response Status Code:", statusCode);
        console.log("Response Success:", responseBody?.success);
        console.log("Generated Subtasks count:", responseBody?.subtasks?.length);
        console.log("Subtasks preview:", JSON.stringify(responseBody?.subtasks, null, 2));

        if (statusCode !== 200 || !responseBody?.success) {
            throw new Error(`Controller failed with status ${statusCode}: ${JSON.stringify(responseBody)}`);
        }

        // 5. Verify database persistence by refetching the task document
        const persistedTask = await Task.findById(task._id);
        console.log("\nPersisted task subtasks in DB count:", persistedTask.subtasks.length);
        console.log("DB Subtasks:", persistedTask.subtasks);

        if (!persistedTask.subtasks || persistedTask.subtasks.length < 3) {
            throw new Error(`Expected at least 3 subtasks in DB, got: ${persistedTask.subtasks?.length}`);
        }

        for (const st of persistedTask.subtasks) {
            if (!st.title) throw new Error("Subtask missing title!");
            if (typeof st.isCompleted !== "boolean") throw new Error("Subtask missing isCompleted boolean!");
            if (typeof st.estimatedMinutes !== "number") throw new Error("Subtask missing estimatedMinutes number!");
        }

        console.log("\n✅ ALL CHECKS PASSED: Subtasks parsed and persisted to Task document successfully!");

        if (createdMock) {
            await Task.findByIdAndDelete(task._id);
            console.log("Cleaned up temporary test task.");
        }
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

runTest().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
