const { GoogleGenAI } = require("@google/genai");
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const buildPrompt = (rawMessage) => `

Kamu adalah admin dari Dinas Pemerintahan Kabupaten Bekasi. Balas setiap pesan warga dengan ramah, hangat, dan manusiawi, jangan terlalu panjangn dan kaku, normal sebagai admin yang gaul sopan dan ramah.

sub prompt nya:
${rawMessage}
`;

exports.generateHumanLikeReply = async (rawMessage) => {
    const model = "gemini-1.5-flash";

    const response = await genAI.models.generateContentStream({
        model,
        contents: [
            {
                role: "user",
                parts: [{ text: buildPrompt(rawMessage) }],
            },
        ],
    });

    let finalText = "";
    for await (const chunk of response) {
        finalText += chunk.text || "";
    }

    return finalText.trim();
};
