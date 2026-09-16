const { GoogleGenerativeAI } = require("@google/generative-ai");
const Task = require("../models/task.model");

/**
 * Controller to generate AI-driven subtasks for a task and persist them.
 * Route: POST /api/v1/workspaces/:workspaceId/projects/:projectId/tasks/:taskId/breakdown
 */
const breakdownTask = async (req, res) => {
    try {
        const { taskId, workspaceId, projectId } = req.params;

        // 1. Fetch task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // Optional workspace/project check if provided
        if (workspaceId && task.workspace && task.workspace.toString() !== workspaceId) {
            return res.status(404).json({
                success: false,
                message: "Task does not belong to the specified workspace",
            });
        }
        if (projectId && task.project && task.project.toString() !== projectId) {
            return res.status(404).json({
                success: false,
                message: "Task does not belong to the specified project",
            });
        }

        // 2. Validate Gemini API Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "GEMINI_API_KEY is not configured in environment variables",
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const prompt = `You are an expert technical project manager.
Break down the following task into 3 to 5 clear, actionable, concise subtasks.

Task Title: ${task.title}
Task Description: ${task.description || "No description provided"}

Respond ONLY with a JSON array conforming to this exact schema:
[
  {
    "title": "Subtask title",
    "estimatedMinutes": 30
  }
]
Requirements:
- Provide between 3 and 5 subtasks.
- "title" must be a concise, actionable string.
- "estimatedMinutes" must be an integer between 5 and 480.
- Do not wrap in markdown or backticks; output pure JSON only.`;

        // 3. Generate structured content with gemini-1.5-flash (with fallback if deprecated/retired by Google)
        let responseText = "";
        const candidateModels = [
            "gemini-1.5-flash",
            "gemini-3.6-flash",
            "gemini-3.7-flash",
            "gemini-flash-latest",
        ];
        let lastError = null;

        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        responseMimeType: "application/json",
                    },
                });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                responseText = response.text();
                if (responseText) break;
            } catch (err) {
                lastError = err;
                // For rate limits / explicit quota exhaust, break and report 429
                if (
                    err.status === 429 ||
                    err.message?.includes("429") ||
                    err.message?.toLowerCase().includes("quota exceeded")
                ) {
                    break;
                }
                // Continue to next candidate model on 404 (model retired/not found) or 503 (high demand)
                continue;
            }
        }

        if (!responseText && lastError) {
            // Handle quota/rate-limit errors
            if (
                lastError.status === 429 ||
                lastError.message?.includes("429") ||
                lastError.message?.toLowerCase().includes("quota") ||
                lastError.message?.toLowerCase().includes("resource has been exhausted")
            ) {
                return res.status(429).json({
                    success: false,
                    message: "Gemini API quota exceeded or rate limited. Please try again in a few moments.",
                });
            }

            return res.status(502).json({
                success: false,
                message: "Failed to generate subtasks from AI service",
                error: lastError.message,
            });
        }

        // 4. Parse JSON output safely
        let rawSubtasks;
        try {
            const cleaned = responseText
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/```\s*$/i, "")
                .trim();
            rawSubtasks = JSON.parse(cleaned);
        } catch (jsonErr) {
            return res.status(502).json({
                success: false,
                message: "AI returned malformed or non-JSON output",
                error: jsonErr.message,
                rawResponse: responseText,
            });
        }

        // Support array directly or { subtasks: [...] }
        const subtaskList = Array.isArray(rawSubtasks)
            ? rawSubtasks
            : Array.isArray(rawSubtasks?.subtasks)
            ? rawSubtasks.subtasks
            : null;

        if (!subtaskList || subtaskList.length === 0) {
            return res.status(502).json({
                success: false,
                message: "AI returned empty or unexpected subtask structure",
            });
        }

        // Normalize subtasks
        const formattedSubtasks = subtaskList.map((st, index) => ({
            title: typeof st === "string" ? st : String(st.title || `Subtask ${index + 1}`),
            isCompleted: false,
            estimatedMinutes: Number.isFinite(Number(st.estimatedMinutes))
                ? Number(st.estimatedMinutes)
                : 30,
        }));

        // 5. Persist subtasks to the task document
        task.subtasks = formattedSubtasks;
        await task.save();

        return res.status(200).json({
            success: true,
            message: "Task broken down into subtasks successfully",
            subtasks: task.subtasks,
            task,
        });
    } catch (error) {
        console.error("AI Task Breakdown Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during AI task breakdown",
            error: error.message,
        });
    }
};

module.exports = {
    breakdownTask,
};
