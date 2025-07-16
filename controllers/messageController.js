const axios = require("axios");
const path = require("path");
const Message = require("../models/messageModel");
const UserSession = require("../models/UserSession");
const { convertWebpToJpegIfNeeded } = require("../utils/imageHelper");

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

exports.sendMessageToWhatsApp = async (to, rawMessage, mode = "bot", saveToDb = true) => {
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID}/messages`;
    const headers = {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
    };
    const MAX_MSG_LENGTH = 4096;

    // Helper: delay antar pesan
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    // ======== SPLIT TEXT JIKA PANJANG =========
    if (typeof rawMessage === "string" && rawMessage.length > MAX_MSG_LENGTH) {
        let idx = 0;
        while (idx < rawMessage.length) {
            const part = rawMessage.slice(idx, idx + MAX_MSG_LENGTH);
            await exports.sendMessageToWhatsApp(to, part, mode, saveToDb);
            await delay(700); // Biar aman, ga dibanned WA
            idx += MAX_MSG_LENGTH;
        }
        return; // Penting! Biar tidak lanjut ke bawah lagi
    }

    let payload;

    // String pendek atau sudah split
    if (typeof rawMessage === "string") {
        payload = {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: String(rawMessage) },
        };
    }
    // Jika rawMessage adalah object → kirim media
    else if (typeof rawMessage === "object" && rawMessage.type === "image") {
        payload = {
            messaging_product: "whatsapp",
            to,
            type: "image",
            image: {
                link: rawMessage.link,
                caption: rawMessage.caption || "",
            },
        };
    } else if (typeof rawMessage === "object" && rawMessage.type === "video") {
        payload = {
            messaging_product: "whatsapp",
            to,
            type: "video",
            video: {
                link: rawMessage.link,
                caption: rawMessage.caption || "",
            },
        };
    } else if (typeof rawMessage === "object" && rawMessage.type === "audio") {
        payload = {
            messaging_product: "whatsapp",
            to,
            type: "audio",
            audio: {
                link: rawMessage.link,
            },
        };
    } else if (typeof rawMessage === "object" && rawMessage.type === "document") {
        payload = {
            messaging_product: "whatsapp",
            to,
            type: "document",
            document: {
                link: rawMessage.link,
                caption: rawMessage.caption || "",
                filename: rawMessage.filename || "document",
            },
        };
    } else {
        console.error("❌ Format pesan tidak valid:", rawMessage);
        return;
    }

    // Kirim pesan ke WhatsApp
    await axios.post(url, payload, { headers });

    // Simpan pesan ke database (opsional)
    if (saveToDb) {
        let messageText = "";
        if (typeof rawMessage === "string") {
            messageText = rawMessage;
        } else if (rawMessage.type === "image") {
            messageText = `[Gambar] ${rawMessage.caption}`;
        } else if (rawMessage.type === "video") {
            messageText = `[Video] ${rawMessage.caption}`;
        } else if (rawMessage.type === "audio") {
            messageText = `[Audio] ${rawMessage.caption || ""}`;
        } else if (rawMessage.type === "document") {
            messageText = `[Dokumen] ${rawMessage.caption}`;
        }
        
        await Message.create({
            from: to,
            senderName: "Bot",
            message: messageText,
            timestamp: new Date(),
        });
    }
};

// 🟢 Handler untuk menerima POST /send/:from dari frontend
exports.sendMessageHandler = async (req, res) => {
    const from = req.params.from;
    let rawMessage = req.body.message;

    // Ambil data tambahan
    const nama_admin = req.body.nama_admin;
    const role = req.body.role;

    if (!rawMessage || typeof rawMessage !== "string") {
        return res.status(400).json({ error: "Pesan harus berupa string." });
    }

    try {
        const session = await UserSession.findOne({ from, status: "in_progress" });
        const mode = session?.mode || "bot";

        // === FORMAT LABEL JIKA MODE MANUAL ===
        if (mode === "manual") {
            let label = "";
            if (role === "Admin") {
                label = `\n\n-Admin ${nama_admin ? " : " + nama_admin : ""}`;
            } else if (role === "SuperAdmin") {
                label = "\n\n-Superadmin";
            } else if (role === "Bupati") {
                label = "\n\n-Bupati";
            }
            rawMessage += label;
        }

        await exports.sendMessageToWhatsApp(from, rawMessage, mode, false); // Don't save to DB

        // Save admin message to database immediately
        await Message.create({
            from,
            senderName: "Admin",
            message: rawMessage,
            timestamp: new Date(),
            isAdminMessage: true // Flag to prevent webhook duplication
        });

        // Emit to frontend via socket with correct admin info
        const io = req.app.get("io");
        if (io) {
            io.emit("newMessage", {
                from,
                senderName: "Admin",
                message: rawMessage,
                timestamp: new Date(),
                isAdminMessage: true
            });
        }

        res.json({ success: true, mode });
    } catch (err) {
        console.error("❌ Error kirim pesan:", err);
        res.status(500).json({ error: "Gagal mengirim pesan." });
    }
};

exports.sendEvidencePhotosToUser = async (photos = [], to) => {
    if (!photos || photos.length === 0) return;

    for (let filePath of photos) {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === ".webp" || ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
            filePath = await convertWebpToJpegIfNeeded(filePath);
        }

        const fileName = path.basename(filePath);
        const encodedFileName = encodeURIComponent(fileName);
        const fullUrl = `${process.env.BASE_URL}/uploadsTindakan/${encodedFileName}`;

        console.log("📸 Mengirim file ke user:", fullUrl);

        try {
            if (ext === ".pdf") {
                // Send as document
                await exports.sendMessageToWhatsApp(to, {
                    type: "document",
                    document: {
                        link: fullUrl,
                        caption: "Berikut dokumentasi hasil tindak lanjut laporan Anda.",
                        filename: fileName,
                    },
                });
            } else {
                // Send as image
                await exports.sendMessageToWhatsApp(to, {
                    type: "image",
                    link: fullUrl,
                    caption: "Berikut dokumentasi hasil tindak lanjut laporan Anda.",
                });
            }
        } catch (err) {
            console.error("❌ Gagal kirim file:", err.response?.data || err.message);
        }
    }
};

exports.sendTutorialImagesToUser = async (to) => {
    const tutorialImages = [
        { filename: "tutorial-lokasi-1.jpeg", caption: "(1) Tata cara kirim lokasi kejadian" },
        { filename: "tutorial-lokasi-2.jpeg", caption: "(2) Tata cara kirim lokasi kejadian" },
        { filename: "tutorial-lokasi-3.jpeg", caption: "(3) Tata cara kirim lokasi kejadian" },
    ];

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const { filename, caption } of tutorialImages) {
        const fullUrl = `${process.env.BASE_URL}/assets/${filename}`;
        try {
            await exports.sendMessageToWhatsApp(to, {
                type: "image",
                link: fullUrl,
                caption,
            });
            await delay(1500); // delay antar gambar
        } catch (err) {
            console.error("❌ Gagal kirim gambar tutorial:", err.response?.data || err.message);
            return false; // gagal kirim salah satu gambar
        }
    }

    return true; // semua gambar berhasil
};

// 🟢 Handler untuk mengirim gambar dari frontend
exports.sendImageHandler = async (req, res) => {
    const from = req.params.from;
    const caption = req.body.caption || "";
    const nama_admin = req.body.nama_admin || "Admin";
    const role = req.body.role || "Admin";
    
    if (!req.file) {
        return res.status(400).json({ error: "Tidak ada file gambar yang diunggah." });
    }

    try {
        const session = await UserSession.findOne({ from, status: "in_progress" });
        const mode = session?.mode || "bot";
        
        // Construct image URL
        const imageUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
        
        // Format message with admin label if manual mode
        let finalCaption = caption;
        if (mode === "manual") {
            let label = "";
            if (role === "Admin") {
                label = `\n\n-Admin ${nama_admin ? " : " + nama_admin : ""}`;
            } else if (role === "SuperAdmin") {
                label = "\n\n-Superadmin";
            } else if (role === "Bupati") {
                label = "\n\n-Bupati";
            }
            finalCaption = caption + label;
        }
        
        // Send image to WhatsApp
        await exports.sendMessageToWhatsApp(from, {
            type: "image",
            link: imageUrl,
            caption: finalCaption
        }, mode);
        
        // Save to database
        await Message.create({
            from,
            senderName: "Admin",
            message: finalCaption || "[Gambar]",
            type: "image",
            mediaUrl: `/uploads/${req.file.filename}`,
            timestamp: new Date(),
            isAdminMessage: true
        });
        
        // Emit to frontend via socket
        const io = req.app.get("io");
        if (io) {
            io.emit("newMessage", {
                from,
                senderName: "Admin",
                message: finalCaption || "[Gambar]",
                type: "image",
                mediaUrl: `/uploads/${req.file.filename}`,
                timestamp: new Date(),
                isAdminMessage: true
            });
        }

        res.json({ success: true, mode, filename: req.file.filename });
    } catch (err) {
        console.error("❌ Error kirim gambar:", err);
        res.status(500).json({ error: "Gagal mengirim gambar." });
    }
};

// 🟢 Handler untuk video upload
exports.sendVideoHandler = async (req, res) => {
    const from = req.params.from;
    const caption = req.body.caption || "";
    const nama_admin = req.body.nama_admin;
    const role = req.body.role;

    if (!req.file) {
        return res.status(400).json({ error: "File video tidak ditemukan." });
    }

    try {
        const session = await UserSession.findOne({ from, status: "in_progress" });
        const mode = session?.mode || "bot";
        
        // Construct video URL
        const videoUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
        
        // Format message with admin label if manual mode
        let finalCaption = caption;
        if (mode === "manual") {
            let label = "";
            if (role === "Admin") {
                label = `\n\n-Admin ${nama_admin ? " : " + nama_admin : ""}`;
            } else if (role === "SuperAdmin") {
                label = "\n\n-Superadmin";
            } else if (role === "Bupati") {
                label = "\n\n-Bupati";
            }
            finalCaption = caption + label;
        }
        
        // Send video to WhatsApp
        await exports.sendMessageToWhatsApp(from, {
            type: "video",
            link: videoUrl,
            caption: finalCaption
        }, mode);
        
        // Save to database
        await Message.create({
            from,
            senderName: "Admin",
            message: finalCaption || "[Video]",
            type: "video",
            mediaUrl: `/uploads/${req.file.filename}`,
            timestamp: new Date(),
            isAdminMessage: true
        });
        
        // Emit to frontend via socket
        const io = req.app.get("io");
        if (io) {
            io.emit("newMessage", {
                from,
                senderName: "Admin",
                message: finalCaption || "[Video]",
                type: "video",
                mediaUrl: `/uploads/${req.file.filename}`,
                timestamp: new Date(),
                isAdminMessage: true
            });
        }

        res.json({ success: true, mode, filename: req.file.filename });
    } catch (err) {
        console.error("❌ Error kirim video:", err);
        res.status(500).json({ error: "Gagal mengirim video." });
    }
};

// 🟢 Handler untuk audio upload
exports.sendAudioHandler = async (req, res) => {
    const from = req.params.from;
    const caption = req.body.caption || "";
    const nama_admin = req.body.nama_admin;
    const role = req.body.role;

    if (!req.file) {
        return res.status(400).json({ error: "File audio tidak ditemukan." });
    }

    try {
        const session = await UserSession.findOne({ from, status: "in_progress" });
        const mode = session?.mode || "bot";
        
        // Construct audio URL
        const audioUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
        
        // Format message with admin label if manual mode
        let finalCaption = caption;
        if (mode === "manual") {
            let label = "";
            if (role === "Admin") {
                label = `\n\n-Admin ${nama_admin ? " : " + nama_admin : ""}`;
            } else if (role === "SuperAdmin") {
                label = "\n\n-Superadmin";
            } else if (role === "Bupati") {
                label = "\n\n-Bupati";
            }
            finalCaption = caption + label;
        }
        
        // Send audio to WhatsApp
        await exports.sendMessageToWhatsApp(from, {
            type: "audio",
            link: audioUrl,
            caption: finalCaption
        }, mode);
        
        // Save to database
        await Message.create({
            from,
            senderName: "Admin",
            message: finalCaption || "[Audio]",
            type: "audio",
            mediaUrl: `/uploads/${req.file.filename}`,
            timestamp: new Date(),
            isAdminMessage: true
        });
        
        // Emit to frontend via socket
        const io = req.app.get("io");
        if (io) {
            io.emit("newMessage", {
                from,
                senderName: "Admin",
                message: finalCaption || "[Audio]",
                type: "audio",
                mediaUrl: `/uploads/${req.file.filename}`,
                timestamp: new Date(),
                isAdminMessage: true
            });
        }

        res.json({ success: true, mode, filename: req.file.filename });
    } catch (err) {
        console.error("❌ Error kirim audio:", err);
        res.status(500).json({ error: "Gagal mengirim audio." });
    }
};

// 🟢 Handler untuk document upload
exports.sendDocumentHandler = async (req, res) => {
    const from = req.params.from;
    const caption = req.body.caption || "";
    const nama_admin = req.body.nama_admin;
    const role = req.body.role;

    if (!req.file) {
        return res.status(400).json({ error: "File dokumen tidak ditemukan." });
    }

    try {
        const session = await UserSession.findOne({ from, status: "in_progress" });
        const mode = session?.mode || "bot";
        
        // Construct document URL
        const docUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${req.file.filename}`;
        
        // Format message with admin label if manual mode
        let finalCaption = caption;
        if (mode === "manual") {
            let label = "";
            if (role === "Admin") {
                label = `\n\n-Admin ${nama_admin ? " : " + nama_admin : ""}`;
            } else if (role === "SuperAdmin") {
                label = "\n\n-Superadmin";
            } else if (role === "Bupati") {
                label = "\n\n-Bupati";
            }
            finalCaption = caption + label;
        }
        
        // Send document to WhatsApp
        await exports.sendMessageToWhatsApp(from, {
            type: "document",
            link: docUrl,
            caption: finalCaption,
            filename: req.file.originalname
        }, mode);
        
        // Save to database
        await Message.create({
            from,
            senderName: "Admin",
            message: finalCaption || "[Dokumen]",
            type: "document",
            mediaUrl: `/uploads/${req.file.filename}`,
            timestamp: new Date(),
            isAdminMessage: true
        });
        
        // Emit to frontend via socket
        const io = req.app.get("io");
        if (io) {
            io.emit("newMessage", {
                from,
                senderName: "Admin",
                message: finalCaption || "[Dokumen]",
                type: "document",
                mediaUrl: `/uploads/${req.file.filename}`,
                timestamp: new Date(),
                isAdminMessage: true
            });
        }

        res.json({ success: true, mode, filename: req.file.filename });
    } catch (err) {
        console.error("❌ Error kirim dokumen:", err);
        res.status(500).json({ error: "Gagal mengirim dokumen." });
    }
};