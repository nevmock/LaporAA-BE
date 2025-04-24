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

                            if (messageType === "text") {
                                parsedMessage = msg.text.body;
                                messagePreviewForLog = parsedMessage;
                            } 
                            else if (messageType === "location") {
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
                            } 
                            else if (messageType === "image") {
                                const mediaId = msg.image.id;
                                const caption = msg.image?.caption || "";

                                // ✅ Download foto ke local
                                const imagePath = await downloadMediaFromMeta(mediaId);

                                parsedMessage = {
                                    type: "image",
                                    image: {
                                        url: imagePath,
                                        caption
                                    }
                                };

                                messagePreviewForLog = `[Image] ${caption}`;
                            } 
                            else {
                                parsedMessage = "Pesan dengan format tidak didukung.";
                                messagePreviewForLog = `[${messageType}]`;
                            }

                            // Simpan pesan masuk ke DB
                            await Message.create({
                                from,
                                senderName: name,
                                message: messagePreviewForLog,
                                timestamp: new Date(),
                            });

                            // Emit ke dashboard FE
                            if (io) {
                                io.emit("newMessage", {
                                    from,
                                    senderName: name,
                                    message: messagePreviewForLog,
                                });
                            }

                            // Jalankan bot (jika mode = bot)
                            const botReply = await botFlowService.handleUserMessage({ from, message: parsedMessage });

                            if (botReply) {
                                if (io) {
                                    io.emit("newMessage", {
                                        from,
                                        senderName: "Bot",
                                        message: botReply,
                                    });
                                }

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
