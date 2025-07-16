const Message = require("../models/messageModel");
const botFlowService = require("../services/botFlowService");
const UserSession = require("../models/UserSession");
const { sendMessageToWhatsApp } = require("./messageController");
const downloadMediaFromMeta = require("../utils/downloadMediaFromMeta");
const modeManager = require("../services/modeManager");

// Enhanced socket event emitters for room-based targeting
const emitToAdmins = (io, event, data) => {
    if (io && io.to) {
        io.to('admins').emit(event, data);
        console.log(`📡 Emitted ${event} to admins room`);
    } else {
        console.warn('⚠️  Socket.IO not available for admin broadcast');
    }
};

const emitToUser = (io, userId, event, data) => {
    if (io && io.to) {
        io.to(`user-${userId}`).emit(event, data);
        console.log(`📡 Emitted ${event} to user ${userId}`);
    }
};

const emitToChat = (io, sessionId, event, data) => {
    if (io && io.to) {
        io.to(`chat_${sessionId}`).emit(event, data);
        console.log(`📡 Emitted ${event} to chat session ${sessionId}`);
    }
};

const emitGlobalUpdate = (io, event, data) => {
    if (io && io.to) {
        io.to('global').emit(event, data);
        console.log(`📡 Emitted ${event} to global room`);
    }
};

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
                            let mediaPath;

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
                                mediaPath = await downloadMediaFromMeta(mediaId);

                                parsedMessage = {
                                    type: "image",
                                    image: {
                                        id: mediaId,
                                        url: mediaPath,
                                        caption
                                    }
                                };

                                messagePreviewForLog = `[Image] ${caption}`;
                            } else if (messageType === "video") {
                                const mediaId = msg.video.id;
                                const caption = msg.video?.caption || "";

                                // ✅ Download video ke local
                                mediaPath = await downloadMediaFromMeta(mediaId);

                                parsedMessage = {
                                    type: "video",
                                    video: {
                                        id: mediaId,
                                        url: mediaPath,
                                        caption
                                    }
                                };

                                messagePreviewForLog = `[Video] ${caption}`;
                            } else if (messageType === "audio") {
                                const mediaId = msg.audio.id;

                                // ✅ Download audio ke local
                                mediaPath = await downloadMediaFromMeta(mediaId);

                                parsedMessage = {
                                    type: "audio",
                                    audio: {
                                        id: mediaId,
                                        url: mediaPath
                                    }
                                };

                                messagePreviewForLog = `[Audio]`;
                            } else if (messageType === "voice") {
                                const mediaId = msg.voice.id;

                                // ✅ Download voice note ke local
                                mediaPath = await downloadMediaFromMeta(mediaId);

                                parsedMessage = {
                                    type: "voice",
                                    voice: {
                                        id: mediaId,
                                        url: mediaPath
                                    }
                                };

                                messagePreviewForLog = `[Voice Note]`;
                            } else if (messageType === "document") {
                                const mediaId = msg.document.id;
                                const filename = msg.document.filename || "document";
                                const caption = msg.document?.caption || "";

                                // ✅ Download document (PDF, DOC, etc.) ke local
                                mediaPath = await downloadMediaFromMeta(mediaId);

                                parsedMessage = {
                                    type: "document",
                                    document: {
                                        id: mediaId,
                                        url: mediaPath,
                                        filename,
                                        caption
                                    }
                                };

                                messagePreviewForLog = `[Document] ${filename} - ${caption}`;
                            } else if (messageType === "sticker") {
                                const mediaId = msg.sticker.id;

                                // ✅ Download sticker ke local
                                mediaPath = await downloadMediaFromMeta(mediaId);

                                parsedMessage = {
                                    type: "sticker",
                                    sticker: {
                                        id: mediaId,
                                        url: mediaPath
                                    }
                                };

                                messagePreviewForLog = `[Sticker]`;
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
                                mediaUrl: ["image", "video", "audio", "voice", "document", "sticker"].includes(messageType) ? mediaPath : undefined,
                                timestamp: new Date()
                            };

                            // Check for recent admin message with same content to prevent duplication
                            const recentAdminMessage = await Message.findOne({
                                from,
                                message: messagePreviewForLog,
                                isAdminMessage: true,
                                timestamp: { $gte: new Date(Date.now() - 30000) } // Within last 30 seconds
                            });

                            if (recentAdminMessage) {
                                console.log("🔄 Skipping duplicate message from webhook (admin already sent this):", messagePreviewForLog);
                                continue; // Skip this message to prevent duplication
                            }

                            await Message.create(messagePayload);

                            if (io) {
                                // Emit to admins room for monitoring
                                emitToAdmins(io, "newMessage", messagePayload);
                                
                                // Emit to specific chat room for real-time updates
                                console.log(`🚀 Emitting to chat room chat_${from} for user message`);
                                emitToChat(io, from, "newMessage", messagePayload);
                                
                                // Also emit globally for compatibility
                                emitGlobalUpdate(io, "newMessage", messagePayload);
                            }

                            // Jalankan bot
                            const sendReply = (to, message) => {
                                if (io) {
                                    const botMessagePayload = {
                                        from: to,
                                        senderName: "Bot",
                                        message,
                                        timestamp: new Date()
                                    };
                                    
                                    // Emit bot response to appropriate rooms
                                    emitToAdmins(io, "newMessage", botMessagePayload);
                                    emitToChat(io, to, "newMessage", botMessagePayload);
                                    emitGlobalUpdate(io, "newMessage", botMessagePayload);
                                }
                                return message;
                            };

                            const botReply = await botFlowService.handleUserMessage({ from, message: parsedMessage, sendReply });

                            console.log(`🤖 Bot processing for ${from}:`, {
                                input: messagePreviewForLog,
                                botReply: botReply ? "Reply generated" : "No reply",
                                effectiveMode: await modeManager.getEffectiveMode(from)
                            });

                            if (botReply) {
                                const effectiveMode = await modeManager.getEffectiveMode(from);
                                if (effectiveMode === "bot") {
                                    console.log(`✅ Sending bot reply to ${from}:`, botReply.substring(0, 100) + "...");
                                    await sendMessageToWhatsApp(from, botReply, "bot", true);
                                } else {
                                    const isForceMode = await modeManager.isInForceMode(from);
                                    console.log(`✋ Bot tidak balas karena effective mode: ${effectiveMode}${isForceMode ? ' (Force Mode)' : ''}`);
                                }
                            } else {
                                console.log(`⚠️ No bot reply generated for message from ${from}: ${messagePreviewForLog}`);
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
