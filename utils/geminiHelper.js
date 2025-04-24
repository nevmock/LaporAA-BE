const { GoogleGenAI } = require("@google/genai");
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const buildPrompt = (rawMessage) => `
kamu itu seorang admin, buatlah balasan yang lebih manusiawi dan alami sebagai admin untuk pesan berikut:

Tapi kamu harus tetap arahkan user untuk memasukan input sesuai dengan pesan aslinya!

Untuk sapaan dan lainnya cukup di menu utama saja. gausah selalu pake sapaan.

menu utamanya itu yang ini:
1. Buat Laporan
2. Cek Status Laporan

### Pesan aslinya:
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
