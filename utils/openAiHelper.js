const { OpenAI } = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const buildMenuContextPrompt = (rawMessage) => `
Kenali konteks kalimatnya. Jawabanmu hanya boleh salah satu dari berikut:
"greeting" - jika kalimat adalah sapaan seperti "halo", "hai", "assalamualaikum", dll.
"new_report" - jika ingin membuat laporan baru.
"check_report" - jika ingin melihat status laporan.
"angry_complaint" - jika kalimat menunjukkan kemarahan atau marah-marah.
"complaint" - jika kalimat menunjukkan keluhan biasa atau mengeluh.
"menu" - untuk konteks lain atau tidak dikenali.

Kalimat atau kata nya:
${rawMessage}
`;

exports.combinedContext = async (rawMessage) => {
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
            temperature: 0.7,
        });

        const result = chat.choices[0].message.content.trim().toLowerCase();

        if (result === "greeting") return "greeting";
        if (result === "new_report") return "new_report";
        if (result === "check_report") return "check_report";
        if (result === "angry_complaint") return "angry_complaint";
        if (result === "complaint") return "complaint";
        return "menu";
    } catch (error) {
        if (error.status === 429) {
            console.warn("Rate limit OpenAI (429) - combinedContext");
            return "menu";
        }

        console.error("❌ OpenAI error (combinedContext):", error.message);
        return "menu";
    }
};
