// models/messageModel.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    from: String,
    senderName: String,
    message: String,
    type: { type: String, default: "text" }, // ✅ text / image / location / etc
    mediaUrl: String,                        // ✅ jika type === image
    timestamp: Date,
});

module.exports = mongoose.model("Message", messageSchema);
