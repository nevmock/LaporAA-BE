const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function convertWebpToJpegIfNeeded(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext !== ".webp") return filePath; // tidak perlu convert

    const inputPath = path.join(__dirname, "../public", filePath); // sesuaikan root
    const outputFileName = path.basename(filePath, ".webp") + ".jpg";
    const outputPath = path.join(__dirname, "../public/uploadsTindakan", outputFileName);

    try {
        await sharp(inputPath).jpeg({ quality: 80 }).toFile(outputPath);
        console.log("✅ Berhasil convert ke JPEG:", outputFileName);
        return `/uploadsTindakan/${outputFileName}`;
    } catch (err) {
        console.error("❌ Gagal convert gambar webp:", err);
        return filePath; // fallback pakai original
    }
}

module.exports = { convertWebpToJpegIfNeeded };