// const axios = require("axios");
// const Message = require("../models/messageModel");

// const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
// const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// exports.sendMessageToWhatsApp = async (to, message) => {
//     const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`;
  
//     const payload = {
//       messaging_product: "whatsapp",
//       to,
//       type: "text",
//       text: { body: message },
//     };
  
//     const headers = {
//       Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
//       "Content-Type": "application/json",
//     };
  
//     await axios.post(url, payload, { headers });
  
//     // Simpan pesan ke DB sebagai balasan bot
//     await Message.create({
//       from: to,
//       senderName: "Bot",
//       message,
//       timestamp: new Date(),
//     });
//   };

const axios = require("axios");
const Message = require("../models/messageModel");
const { generateHumanLikeReply } = require("../utils/geminiHelper");

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

exports.sendMessageToWhatsApp = async (to, rawMessage) => {
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`;

    // 🧠 Proses dengan Gemini untuk hasil yang lebih manusiawi
    let message;
    try {
        message = await generateHumanLikeReply(rawMessage);
    } catch (err) {
        console.error("❌ Gagal generate dari Gemini, fallback ke raw message");
        message = rawMessage;
    }

    const payload = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
    };

    const headers = {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
    };

    await axios.post(url, payload, { headers });

    // Simpan pesan ke DB
    await Message.create({
        from: to,
        senderName: "Bot",
        message,
        timestamp: new Date(),
    });
};

