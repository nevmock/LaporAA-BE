const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const Message = require("../models/messageModel");

// 🔵 Route untuk mengirim pesan dan broadcast via WebSocket
router.post("/send/:from", messageController.sendMessageToWhatsApp);

// 🔵 Endpoint untuk mendapatkan semua chat berdasarkan nomor telepon
router.get("/:from", async (req, res) => {
    try {
        const messages = await Message.find({ from: req.params.from }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        console.error("❌ Error mengambil pesan:", error);
        res.status(500).json({ error: "Gagal mengambil pesan." });
    }
});

// 🔵 Endpoint untuk mendapatkan daftar pengirim unik berdasarkan database
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
