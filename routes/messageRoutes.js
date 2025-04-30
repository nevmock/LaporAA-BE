const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const Message = require("../models/messageModel");

// 🔵 Kirim pesan ke WhatsApp (dengan deteksi mode bot/manual)
router.post("/send/:from", messageController.sendMessageHandler);

// 🔵 Ambil semua pesan berdasarkan nomor
router.get("/:from", async (req, res) => {
    try {
        const { from } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const skip = parseInt(req.query.skip) || 0;

        const messages = await Message.find({ from })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        res.json(messages.reverse());
    } catch (err) {
        console.error("❌ Error ambil pesan:", err);
        res.status(500).json({ error: "Gagal mengambil pesan." });
    }
});

// 🔵 Ambil daftar pengirim unik (untuk sidebar/chat list)
router.get("/", async (req, res) => {
    try {
        const uniqueChats = await Message.aggregate([
            { $group: { _id: "$from", senderName: { $first: "$senderName" } } }
        ]);
        res.json(uniqueChats);
    } catch (error) {
        console.error("❌ Error mengambil daftar chat:", error);
        res.status(500).json({ error: "Gagal mengambil daftar chat." });
    }
});

module.exports = router;
