const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Konfigurasi folder penyimpanan
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploadsTindakan");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

// Upload multiple photos untuk tindakan
router.post("/upload-tindakan", upload.array("photos", 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "Tidak ada file yang diunggah." });
    }

    const filePaths = req.files.map(file => `/uploadsTindakan/${file.filename}`);
    res.status(200).json({ success: true, paths: filePaths });
});

module.exports = router;
