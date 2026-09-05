const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Generate 3-6 actionable subtasks for a given task using Google Gemini.
 *
 * @param {string} title       - Task title
 * @param {string} description - Task description (optional)
 * @returns {Promise<string[]>} Array of subtask title strings
 * @throws  {Error}            On missing API key, API failure, or bad response format
 */
const generateSubtasks = async (title, description = "") => {
    // Runtime check — ensures dotenv has loaded before the key is read
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
You are an expert project manager. Break down the following task into 3 to 6 actionable, concise subtasks.

Task Title: ${title}
Task Description: ${description || "N/A"}

Respond strictly with valid JSON and no markdown formatting or commentary. Use this exact JSON structure:
{
  "subtasks": [
    "Subtask 1",
    "Subtask 2",
    "Subtask 3"
  ]
}
`.trim();

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text() || "";

        // Strip markdown code fences if the model includes them despite instructions
        const cleanedText = rawText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();

        const parsed = JSON.parse(cleanedText);

        if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
            throw new Error("Invalid format returned from Gemini");
        }

        return parsed.subtasks;
    } catch (err) {
        console.error("Gemini API Error Detail:", err);
        throw err;
    }
};

module.exports = { generateSubtasks };
