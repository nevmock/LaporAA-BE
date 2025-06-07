const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { generateUniqueFilename } = require("../utils/fileRenameHelper");

const router = express.Router();

// Konfigurasi folder penyimpanan
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploadsTindakan");
    },

    filename: function (req, file, cb) {
        const uniqueName = generateUniqueFilename(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("File type tidak diizinkan"), false);
    }
};

const upload = multer({ storage, fileFilter });

// Upload multiple photos atau dokumen untuk tindakan
router.post("/upload-tindakan", upload.array("photos", 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Tidak ada file yang diunggah." });
    }

    const filePaths = req.files.map(file => `/uploadsTindakan/${file.filename}`);
    res.status(200).json({ success: true, paths: filePaths });
});

module.exports = router;
