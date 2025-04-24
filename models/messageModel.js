const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    from: { type: String, required: true }, // Nomor WhatsApp pengirim
    senderName: { type: String, required: true }, // Nama pengirim
    message: { type: String, required: true }, // Isi pesan
    timestamp: { type: Date, default: Date.now }, // Waktu pesan dikirim
});

module.exports = mongoose.model("Message", MessageSchema);
