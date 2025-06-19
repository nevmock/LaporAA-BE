const Message = require("../models/messageModel");
const botFlowService = require("../services/botFlowService");
const UserSession = require("../models/UserSession");
const { sendMessageToWhatsApp } = require("./messageController");
const downloadMediaFromMeta = require("../utils/downloadMediaFromMeta");

exports.handleIncomingMessages = async (req, res) => {
    try {
        const data = req.body;
        const io = req.app.get("io");

        if (data.object === "whatsapp_business_account") {
            console.log("📩 Pesan masuk dari WhatsApp:", JSON.stringify(data, null, 2));

            for (const entry of data.entry) {
                for (const change of entry.changes) {
                    const messages = change.value?.messages;
                    const contacts = change.value?.contacts;

                    if (messages) {
                        for (const msg of messages) {
                            const from = msg.from;
                            const name = contacts?.[0]?.profile?.name || "Unknown";
                            const messageType = msg.type;

                            let parsedMessage = "Pesan tidak dikenal";
                            let messagePreviewForLog = "";
                            let imagePath;

                            if (messageType === "text") {
                                parsedMessage = msg.text.body;
                                messagePreviewForLog = parsedMessage;
                            } else if (messageType === "location") {
                                const loc = msg.location;
                                parsedMessage = {
                                    type: "location",
                                    location: {
                                        latitude: loc.latitude,
                                        longitude: loc.longitude,
                                        description: loc.name || loc.address || "Lokasi tidak diberi nama"
                                    }
                                };
                                messagePreviewForLog = `[Location] ${parsedMessage.location.description}`;
                            } else if (messageType === "image") {
                                const mediaId = msg.image.id;
                                const caption = msg.image?.caption || "";

                                // ✅ Download foto ke local
                                imagePath = await downloadMediaFromMeta(mediaId);

                                parsedMessage = {
                                    type: "image",
                                    image: {
                                        id: mediaId,
                                        url: imagePath,
                                        caption
                                    }
                                };

                                messagePreviewForLog = `[Image] ${caption}`;
                            } else {
                                parsedMessage = "Pesan dengan format tidak didukung.";
                                messagePreviewForLog = `[${messageType}]`;
                            }

                            // ✅ SIMPAN SEKALI, EMIT SEKALI
                            const messagePayload = {
                                from,
                                senderName: name,
                                message: messagePreviewForLog,
                                type: messageType,
                                mediaUrl: messageType === "image" ? imagePath : undefined,
                                timestamp: new Date()
                            };

                            await Message.create(messagePayload);

                            if (io) {
                                io.emit("newMessage", messagePayload);
                            }

                            // Jalankan bot
                            const sendReply = (to, message) => {
                                if (io) {
                                    io.emit("newMessage", {
                                        from: to,
                                        senderName: "Bot",
                                        message,
                                        timestamp: new Date()
                                    });
                                }
                                return message;
                            };

                            const botReply = await botFlowService.handleUserMessage({ from, message: parsedMessage, sendReply });

                            if (botReply) {
                                const session = await UserSession.findOne({ from, status: "in_progress" });
                                if (!session || session.mode === "bot") {
                                    await sendMessageToWhatsApp(from, botReply);
                                } else {
                                    console.log(`✋ Bot tidak balas karena mode: ${session.mode}`);
                                }
                            }
                        }
                    }
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("❌ Error handling incoming messages:", error);
        res.sendStatus(500);
    }
};
