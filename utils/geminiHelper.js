const { GoogleGenAI } = require("@google/genai");
const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Util: delay untuk retry jika 429
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const buildPrompt = (rawMessage) => `
Kamu adalah admin dari Dinas Pemerintahan Kabupaten Bekasi. 
Balas setiap pesan warga dengan ramah, hangat, dan manusiawi. Jangan terlalu panjang dan kaku, normal seperti admin resmi yang sopan.
Jangan gunakan kata "pilih", tapi pakai kata "ketik", dan gunakan tanda petik ("") untuk input yang harus diketik warga.
Jangan membalas dengan sapaan kalau sub prompt-nya bukan sapaan.

sub prompt nya:
${rawMessage}
`;

const buildStartContextPrompt = (rawMessage) => `
Kenali konteks kalimat dari warga. Jawabanmu hanya boleh "true" atau "false".
Konteks yang dimaksud adalah sapaan seperti "halo", "hai", "assalamualaikum", dan sejenisnya.

Kalimat warga:
${rawMessage}
`;

// Fungsi utama balasan AI
exports.generateHumanLikeReply = async (rawMessage) => {
    const model = "gemini-1.5-flash";

    if (!rawMessage || typeof rawMessage !== "string") return "Maaf, sistem tidak menerima input yang sesuai.";

    try {
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
    } catch (error) {
        if (error.message.includes("429")) {
            console.warn("Rate limit Gemini (429) - generateHumanLikeReply");
            return "Mohon tunggu sebentar, sistem sedang sibuk. Silakan coba beberapa saat lagi.";
        }

        console.error("❌ Gemini error (generateHumanLikeReply):", error.message);
        return "Terjadi kesalahan saat memproses pesan. Silakan coba lagi nanti.";
    }
};

// Fungsi cek konteks sapaan
exports.startContext = async (rawMessage) => {
    const model = "gemini-1.5-flash";

    if (!rawMessage || typeof rawMessage !== "string") return "false";

    try {
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

        return finalText.trim().toLowerCase().includes("true") ? "true" : "false";
    } catch (error) {
        if (error.message.includes("429")) {
            console.warn("Rate limit Gemini (429) - startContext");
            return "false"; // fallback aman
        }

        console.error("❌ Gemini error (startContext):", error.message);
        return "false";
    }
};
