const { OpenAI } = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const moment = require("moment-timezone");

const buildPrompt = (rawMessage) => {
    const nowWIB = moment().tz("Asia/Jakarta");
    const timeNow = nowWIB.format("HH:mm");
    const hour = parseInt(nowWIB.format("HH"));

    let waktu = "malam";
    if (hour >= 5 && hour < 11) waktu = "pagi";
    else if (hour >= 11 && hour < 15) waktu = "siang";
    else if (hour >= 15 && hour < 18) waktu = "sore";

    return `
Kamu adalah admin dari Dinas Pemerintahan Kabupaten Bekasi. 
Balas setiap pesan warga dengan ramah, hangat, dan manusiawi. Jangan terlalu panjang dan kaku, balas seperti admin resmi yang sopan.
Gausah ucapkan sapaan kalau sub prompt-nya tidak menyuruh menyapa, terimakasih, minta maaf, dan hal lain yang tidak memerlukan sapaan.

Saat ini waktu menunjukkan pukul ${timeNow} WIB, yaitu waktu ${waktu}.
Gunakan informasi waktu ini jika subprompt sapaan atau waktu relevan.

sub prompt-nya:
${rawMessage}
`;
};

const buildStartContextPrompt = (rawMessage) => `
Kenali konteks kalimat dari warga. Jawabanmu hanya boleh "true" atau "false".
Konteks yang dimaksud adalah sapaan seperti "halo", "hai", "assalamualaikum", dan sejenisnya.

kalimat atau kata nya:
${rawMessage}
`;

const buildMenuContextPrompt = (rawMessage) => `
Kenali konteks kalimat dari warga. Jawabanmu hanya boleh "1" atau "2".
Kalau Konteks nya adalah ingin membuat laporan baru, jawabannya "1"
Kalau Konteks nya adalah ingin melihat status laporan, jawabannya "2"
diluar itu jawabannya "menu"

kalimat atau kata nya:
${rawMessage}
`;

exports.generateHumanLikeReply = async (rawMessage) => {
    if (!rawMessage || typeof rawMessage !== "string") return "Maaf, sistem tidak menerima input yang sesuai.";

    try {
        const chat = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // atau "gpt-4" kalau kamu punya akses
            messages: [
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
                    role: "user",
                    content: buildStartContextPrompt(rawMessage),
                },
            ],
            temperature: 0.7,
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
            temperature: 0.7,
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