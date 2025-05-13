const { OpenAI } = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const buildPrompt = (rawMessage) => `
Kamu adalah admin dari Dinas Pemerintahan Kabupaten Bekasi. 
Balas setiap pesan warga dengan ramah, hangat, dan manusiawi. Jangan terlalu panjang dan kaku, normal seperti admin resmi yang sopan.
Jangan gunakan kata "pilih", tapi pakai kata "ketik".

sub prompt nya:
${rawMessage}
`;

const buildStartContextPrompt = (rawMessage) => `
Kenali konteks kalimat dari warga. Jawabanmu hanya boleh "true" atau "false".
Konteks yang dimaksud adalah sapaan seperti "halo", "hai", "assalamualaikum", dan sejenisnya.

Kalimat warga:
${rawMessage}
`;

exports.generateHumanLikeReply = async (rawMessage) => {
    if (!rawMessage || typeof rawMessage !== "string") return "Maaf, sistem tidak menerima input yang sesuai.";

    try {
        const chat = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // atau "gpt-4" kalau kamu punya akses
            messages: [
                {
                    role: "system",
                    content: "Kamu adalah admin ramah dari Dinas Pemerintahan Kabupaten Bekasi.",
                },
                {
                    role: "user",
                    content: buildPrompt(rawMessage),
                },
            ],
            temperature: 0.7,
        });

        return chat.choices[0].message.content.trim();
    } catch (error) {
        if (error.status === 429) {
            console.warn("Rate limit OpenAI (429) - generateHumanLikeReply");
            return "Mohon tunggu sebentar, sistem sedang sibuk. Silakan coba beberapa saat lagi.";
        }

        console.error("❌ OpenAI error (generateHumanLikeReply):", error.message);
        return "Terjadi kesalahan saat memproses pesan. Silakan coba lagi nanti.";
    }
};

exports.startContext = async (rawMessage) => {
    if (!rawMessage || typeof rawMessage !== "string") return "false";

    try {
        const chat = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Tugas kamu hanya mengenali apakah sebuah kalimat termasuk sapaan atau bukan. Jawab hanya dengan 'true' atau 'false'.",
                },
                {
                    role: "user",
                    content: buildStartContextPrompt(rawMessage),
                },
            ],
            temperature: 0,
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
