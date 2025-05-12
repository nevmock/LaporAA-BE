const { GoogleGenAI } = require("@google/genai");
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const buildPrompt = (rawMessage) => `

Kamu adalah admin dari Dinas Pemerintahan Kabupaten Bekasi. 
Balas setiap pesan warga dengan ramah, hangat, dan manusiawi, jangan terlalu panjangn dan kaku, normal sebagai admin yang gaul sopan dan ramah.
Jangan ada istilah pilih tapi ketik, agar user dapat menerima konteksnya.
Jangan ada respon sapaan, kalau konteks sub prompt nya bukan sapaan, langsung saja jawab pertanyaannya.


sub prompt nya:
${rawMessage}
`;

const buildStartContextPrompt = (rawMessage) => `
Kenali Konteks kalimat yang di berikan oleh user, outputnya hanya true atau false.
Konteksnya itu halo, atau pernyataan sapaan.
ini kalimat dari usernya:
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

exports.startContext = async (rawMessage) => {
    const model = "gemini-1.5-flash";

    const response = await genAI.models.generateContentStream({
        model,
        contents: [
            {
                role: "user",
                parts: [{ text: buildStartContextPrompt(rawMessage) }],
            },
        ],
    });

    let finalText = "";
    for await (const chunk of response) {
        finalText += chunk.text || "";
    }

    return finalText.trim();
};
