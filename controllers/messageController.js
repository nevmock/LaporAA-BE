const axios = require("axios");
const Message = require("../models/messageModel");
const UserSession = require("../models/UserSession");
const { generateHumanLikeReply } = require("../utils/geminiHelper");

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

exports.sendMessageToWhatsApp = async (to, rawMessage, mode = "bot") => {
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`;

    let message = rawMessage;

    // 🧠 Proses Gemini hanya jika mode bot
    if (mode === "bot") {
        try {
            message = await generateHumanLikeReply(rawMessage);
        } catch (err) {
            console.error("❌ Gagal generate dari Gemini, fallback ke raw message");
            message = rawMessage;
        }
    }

    // Validasi agar pesan tidak berbentuk object
    if (typeof message !== "string") {
        console.error("❌ Invalid message format. Must be string. Got:", typeof message);
        message = "[pesan tidak dapat dikirim: format tidak valid]";
    }

    const payload = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: String(message) },
    };

    const headers = {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
    };

    await axios.post(url, payload, { headers });

    // Simpan pesan ke DB
    const savedMessage = await Message.create({
        from: to,
        senderName: "Bot",
        message,
        timestamp: new Date(),
    });
    
    // ✅ Emit agar langsung tampil di frontend
    if (global.io) {
        global.io.emit("newMessage", savedMessage);
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
