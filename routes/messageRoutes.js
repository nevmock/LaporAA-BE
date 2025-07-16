const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const Message = require("../models/messageModel");
const multer = require("multer");
const path = require("path");

// 🔵 Multer configuration for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `admin-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diperbolehkan!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 🔵 Multer configuration for video upload
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const uploadVideo = multer({
    storage: videoStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp4|webm|ogg|mov|avi|mkv|wmv|flv|3gp/;
        const allowedMimeTypes = [
            'video/mp4',
            'video/webm', 
            'video/ogg',
            'video/quicktime', // MOV
            'video/x-msvideo', // AVI
            'video/x-matroska', // MKV
            'video/x-ms-wmv', // WMV
            'video/x-flv', // FLV
            'video/3gpp' // 3GP
        ];
        
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedMimeTypes.includes(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Hanya file video yang diperbolehkan (MP4, WebM, MOV, AVI, MKV, WMV, FLV, 3GP)!'));
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// 🔵 Multer configuration for audio upload
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const uploadAudio = multer({
    storage: audioStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp3|wav|ogg|m4a|aac|flac|opus|wma/;
        const allowedMimeTypes = [
            'audio/mpeg', // MP3
            'audio/wav',
            'audio/wave', 
            'audio/x-wav',
            'audio/ogg',
            'audio/mp4', // M4A
            'audio/aac',
            'audio/x-aac',
            'audio/flac',
            'audio/x-flac',
            'audio/opus',
            'audio/x-ms-wma' // WMA
        ];
        
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedMimeTypes.includes(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Hanya file audio yang diperbolehkan (MP3, WAV, OGG, M4A, AAC, FLAC, OPUS, WMA)!'));
        }
    },
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// 🔵 Multer configuration for document upload
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const uploadDocument = multer({
    storage: documentStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp/;
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/rtf',
            'application/rtf',
            'application/vnd.oasis.opendocument.text', // ODT
            'application/vnd.oasis.opendocument.spreadsheet', // ODS
            'application/vnd.oasis.opendocument.presentation', // ODP
            'application/zip' // untuk beberapa file office yang di-zip
        ];
        
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedMimeTypes.includes(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Hanya file dokumen yang diperbolehkan (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, ODT, ODS, ODP)!'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 🔵 Kirim pesan ke WhatsApp (dengan deteksi mode bot/manual)
router.post("/send/:from", messageController.sendMessageHandler);

// 🔵 Kirim gambar ke WhatsApp
router.post("/send/image/:from", upload.single('image'), messageController.sendImageHandler);

// 🔵 Kirim video ke WhatsApp
router.post("/send/video/:from", uploadVideo.single('video'), messageController.sendVideoHandler);

// 🔵 Kirim audio ke WhatsApp
router.post("/send/audio/:from", uploadAudio.single('audio'), messageController.sendAudioHandler);

// 🔵 Kirim dokumen ke WhatsApp
router.post("/send/document/:from", uploadDocument.single('document'), messageController.sendDocumentHandler);

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
            { $group: { _id: "$from", senderName: { $first: "$senderName" }, lastMessage: { $last: "$message" }, lastTimestamp: { $last: "$timestamp" } } },
            { $sort: { lastTimestamp: -1 } } // Sort by latest message
        ]);
        res.json(uniqueChats);
    } catch (error) {
        console.error("❌ Error mengambil daftar chat:", error);
        res.status(500).json({ error: "Gagal mengambil daftar chat." });
    }
});

// 🔵 Ambil mode chat untuk nomor tertentu
router.get("/mode/:from", async (req, res) => {
    try {
        const { from } = req.params;
        const UserSession = require("../models/UserSession");
        const modeManager = require("../services/modeManager");
        
        const session = await UserSession.findOne({ from, status: "in_progress" });
        const effectiveMode = await modeManager.getEffectiveMode(from);
        const isForceMode = await modeManager.isInForceMode(from);
        
        res.json({
            mode: effectiveMode,
            isForceMode,
            sessionMode: session?.mode || "bot"
        });
    } catch (error) {
        console.error("❌ Error mengambil mode chat:", error);
        res.status(500).json({ error: "Gagal mengambil mode chat." });
    }
});

module.exports = router;
