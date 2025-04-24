require("dotenv").config(); // Load konfigurasi dari .env

exports.verifyWebhook = (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("✅ Webhook berhasil diverifikasi oleh Meta.");
        res.status(200).send(challenge); // Wajib mengembalikan challenge agar validasi sukses
    } else {
        console.log("❌ Webhook verifikasi gagal. Token tidak cocok.");
        res.sendStatus(403);
    }
}; 