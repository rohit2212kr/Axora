require("dotenv").config();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../app");
const Task = require("../models/task.model");
const User = require("../models/user.model");

async function testHttpRoute() {
    console.log("=== Testing Express Route Matching & Auth ===");
    await mongoose.connect(process.env.MONGODB_URI);

    try {
        const task = await Task.findOne();
        if (!task) throw new Error("No task found in DB");

        const user = await User.findOne();
        if (!user) throw new Error("No user found in DB");

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        const server = app.listen(0); // random available port
        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}/api/v1/workspaces/${task.workspace}/projects/${task.project}/tasks/${task._id}/breakdown`;

        console.log(`Testing endpoint: ${baseUrl}`);

        // Test 1: Without Token -> should return 401
        const resUnauth = await fetch(baseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const unauthJson = await resUnauth.json();
        console.log("Test 1 (No auth) Status:", resUnauth.status, unauthJson);
        if (resUnauth.status !== 401) throw new Error("Expected 401 Unauthorized");

        // Test 2: With valid Token -> should return 200
        const resAuth = await fetch(baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });
        const authJson = await resAuth.json();
        console.log("Test 2 (With auth) Status:", resAuth.status, "Subtasks:", authJson?.subtasks?.length);

        if (resAuth.status !== 200 || !authJson.success) {
            throw new Error(`Expected 200 OK, got: ${resAuth.status} - ${JSON.stringify(authJson)}`);
        }

        console.log("✅ Route mounted under /api/v1 works over HTTP with auth and persistence!");

        server.close();
    } finally {
        await mongoose.disconnect();
    }
}

testHttpRoute().catch((err) => {
    console.error("❌ Route test failed:", err);
    process.exit(1);
});
