const express = require("express");
const router = express.Router();
const webhookVerification = require("../controllers/webhookVerification");
const webhookController = require("../controllers/webhookController");
const botController = require("../controllers/botController");

// 🟢 Route GET untuk verifikasi webhook (Hanya dipakai sekali saat setup)
router.get("/", webhookVerification.verifyWebhook);

// 🔵 Route POST untuk menangani pesan WhatsApp yang masuk
router.post("/", webhookController.handleIncomingMessages);

// 🔵 Route POST untuk menangani pesan dari bot
router.post("/send", botController.handleIncomingMessage);

module.exports = router;
