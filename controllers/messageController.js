const axios = require("axios");
const path = require("path");
const Message = require("../models/messageModel");
const UserSession = require("../models/UserSession");
const { convertWebpToJpegIfNeeded } = require("../utils/imageHelper");

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

exports.sendMessageToWhatsApp = async (to, rawMessage, mode = "bot") => {
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`;

    let payload;

    // Jika rawMessage adalah string → kirim teks
    if (typeof rawMessage === "string") {
        let message = rawMessage;

        if (mode === "bot") {
            try {
                message = rawMessage;
            } catch (err) {
                console.error("❌ Gagal generate dari Gemini, fallback ke raw message");
                message = rawMessage;
            }
        }

        payload = {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: String(message) },
        };
    }

    // Jika rawMessage adalah object → kirim media
    else if (typeof rawMessage === "object" && rawMessage.type === "image") {
        payload = {
            messaging_product: "whatsapp",
            to,
            type: "image",
            image: {
                link: rawMessage.link,
                caption: rawMessage.caption || "",
            },
        };
    } else {
        console.error("❌ Format pesan tidak valid:", rawMessage);
        return;
    }

    const headers = {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
    };

    await axios.post(url, payload, { headers });

    // Simpan pesan ke database (opsional untuk image)
    await Message.create({
        from: to,
        senderName: "Bot",
        message: typeof rawMessage === "string" ? rawMessage : `[image] ${rawMessage.caption}`,
        timestamp: new Date(),
    });

    // Emit ke frontend
    if (global.io) {
        global.io.emit("newMessage", {
            from: to,
            senderName: "Bot",
            message: typeof rawMessage === "string" ? rawMessage : `[image] ${rawMessage.caption}`,
            timestamp: new Date(),
        });
    }
};

// 🟢 Handler untuk menerima POST /send/:from dari frontend
exports.sendMessageHandler = async (req, res) => {
    const from = req.params.from;
    const rawMessage = req.body.message;

    if (!rawMessage || typeof rawMessage !== "string") {
        return res.status(400).json({ error: "Pesan harus berupa string." });
    }

    try {
        const session = await UserSession.findOne({ from, status: "in_progress" });
        const mode = session?.mode || "bot";

        await exports.sendMessageToWhatsApp(from, rawMessage, mode);

        res.json({ success: true, mode });
    } catch (err) {
        console.error("❌ Error kirim pesan:", err);
        res.status(500).json({ error: "Gagal mengirim pesan." });
    }
};

exports.sendEvidencePhotosToUser = async (photos = [], to) => {
    if (!photos || photos.length === 0) return;

    for (let filePath of photos) {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === ".webp" || ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
            filePath = await convertWebpToJpegIfNeeded(filePath);
        }

        const fileName = path.basename(filePath);
        const encodedFileName = encodeURIComponent(fileName);
        const fullUrl = `${process.env.BASE_URL}/uploadsTindakan/${encodedFileName}`;

        console.log("📸 Mengirim file ke user:", fullUrl);

        try {
            if (ext === ".pdf") {
                // Send as document
                await exports.sendMessageToWhatsApp(to, {
                    type: "document",
                    document: {
                        link: fullUrl,
                        caption: "Berikut dokumentasi hasil tindak lanjut laporan Anda.",
                        filename: fileName,
                    },
                });
            } else {
                // Send as image
                await exports.sendMessageToWhatsApp(to, {
                    type: "image",
                    link: fullUrl,
                    caption: "Berikut dokumentasi hasil tindak lanjut laporan Anda.",
                });
            }
        } catch (err) {
            console.error("❌ Gagal kirim file:", err.response?.data || err.message);
        }
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.sendTutorialImagesToUser = async (to) => {
    const tutorialImages = [
        { filename: "tutorial-lokasi-1.jpeg", caption: "(1) Tata cara kirim lokasi kejadian" },
        { filename: "tutorial-lokasi-2.jpeg", caption: "(2) Tata cara kirim lokasi kejadian" },
        { filename: "tutorial-lokasi-3.jpeg", caption: "(3) Tata cara kirim lokasi kejadian" },
    ];

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const { filename, caption } of tutorialImages) {
        const fullUrl = `${process.env.BASE_URL}/assets/${filename}`;
        try {
            await exports.sendMessageToWhatsApp(to, {
                type: "image",
                link: fullUrl,
                caption,
            });
            await delay(1000); // delay antar gambar
        } catch (err) {
            console.error("❌ Gagal kirim gambar tutorial:", err.response?.data || err.message);
            return false; // gagal kirim salah satu gambar
        }
    }

    return true; // semua gambar berhasil
};