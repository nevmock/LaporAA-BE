const { GoogleGenAI } = require("@google/genai");
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const buildPrompt = (rawMessage) => `

ini prompt utamanya

kamu itu seorang admin, buatlah balasan yang lebih manusiawi dan alami sebagai admin untuk semua sub prompt yang kamu terima nanti
balasannya harus humanis, sopan dan tidak kaku. dan tidak usah panjang panjang chat nya. hindari istilah istilah teknis yang sulit dimengerti oleh orang awam

berikut ini adalah sub prompt nya:
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
