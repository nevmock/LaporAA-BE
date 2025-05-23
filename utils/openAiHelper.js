const { OpenAI } = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ==== PROMPT BUILDERS ====

const buildStartContextPrompt = (rawMessage) =>
    `Balas hanya "true" jika ini sapaan seperti halo, hai, assalamualaikum; selain itu balas "false":\n\n"${rawMessage}"`;

const buildMenuContextPrompt = (rawMessage) =>
    `Balas hanya:\n- "1" jika ini maksudnya buat laporan\n- "2" jika maksudnya cek status laporan\n- "menu" jika tidak keduanya\n\nPesan: "${rawMessage}"`;

// ==== START CONTEXT ====

exports.startContext = async (rawMessage) => {
    if (!rawMessage || typeof rawMessage !== "string") return "false";

    try {
        const chat = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: buildStartContextPrompt(rawMessage),
                },
            ],
            temperature: 0,
            max_tokens: 5,
        });

        const result = chat.choices[0].message.content.trim().toLowerCase();
        return result.includes("true") ? "true" : "false";
    } catch (error) {
        if (error.status === 429) {
            console.warn("Rate limit OpenAI (429) - startContext");
            return "false";
        }
        console.error("❌ OpenAI error (startContext):", error.message);
        return "false";
    }
};

// ==== MENU CONTEXT ====

exports.menuContext = async (rawMessage) => {
    if (!rawMessage || typeof rawMessage !== "string") return "menu";

    try {
        const chat = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: buildMenuContextPrompt(rawMessage),
                },
            ],
            temperature: 0,
            max_tokens: 5,
        });

        const result = chat.choices[0].message.content.trim();
        if (result === "1") return "1";
        if (result === "2") return "2";
        return "menu";
    } catch (error) {
        if (error.status === 429) {
            console.warn("Rate limit OpenAI (429) - menuContext");
            return "menu";
        }
        console.error("❌ OpenAI error (menuContext):", error.message);
        return "menu";
    }
};
