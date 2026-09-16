const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Generate 3-5 structured subtasks for a given task using Google Gemini.
 *
 * @param {string} title       - Task title
 * @param {string} description - Task description (optional)
 * @returns {Promise<Array<{title: string, estimatedMinutes: number}>>}
 * @throws  {Error} On missing API key, API quota exceeded, or bad response format
 */
const generateSubtasks = async (title, description = "") => {
    // Runtime check — ensures dotenv has loaded before the key is read
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an expert project manager. Break down the following task into 3 to 5 actionable, concise subtasks.

Task Title: ${title}
Task Description: ${description || "N/A"}

Respond ONLY with a valid JSON array — no markdown, no commentary, no code fences.
Each item must have exactly these two fields:
- "title": a short, actionable subtask description (string)
- "estimatedMinutes": realistic time estimate in minutes (integer between 5 and 480)

Example output:
[
  { "title": "Research existing solutions", "estimatedMinutes": 30 },
  { "title": "Draft initial implementation", "estimatedMinutes": 60 }
]
`.trim();

    try {
        const result   = await model.generateContent(prompt);
        const response = await result.response;
        const rawText  = response.text() || "";

        // Strip markdown code fences if the model includes them despite instructions
        const cleanedText = rawText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();

        let parsed;
        try {
            parsed = JSON.parse(cleanedText);
        } catch {
            throw new Error(`Gemini returned non-JSON response: ${cleanedText.slice(0, 200)}`);
        }

        // Accept both array format [ {...} ] and object format { subtasks: [...] }
        const subtasks = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.subtasks)
                ? parsed.subtasks
                : null;

        if (!subtasks || subtasks.length === 0) {
            throw new Error("Gemini returned an empty or unrecognised subtask format");
        }

        // Normalise — guarantee each item has title + estimatedMinutes
        return subtasks.map((item, i) => ({
            title: typeof item === "string"
                ? item                                       // backward-compat plain string
                : String(item.title || `Step ${i + 1}`),
            estimatedMinutes: Number.isFinite(item.estimatedMinutes)
                ? item.estimatedMinutes
                : 30,                                        // safe fallback
        }));

    } catch (err) {
        // Surface quota/rate-limit errors clearly
        if (err.message?.includes("429") || err.message?.toLowerCase().includes("quota")) {
            throw new Error("Gemini API quota exceeded. Please try again later.");
        }
        console.error("Gemini API Error Detail:", err);
        throw err;
    }
};

module.exports = { generateSubtasks };
