const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { generateUniqueFilename } = require("./fileRenameHelper");

const PAGE_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function downloadMediaFromMeta(mediaId) {
    try {
        // Step 1: Ambil URL file
        const { data: metaInfo } = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
            headers: { Authorization: `Bearer ${PAGE_TOKEN}` }
        });

        const mediaUrl = metaInfo.url;
        const mimeType = metaInfo.mime_type;

        // Step 2: Download file (as buffer)
        const response = await axios.get(mediaUrl, {
            responseType: "arraybuffer",
            headers: { Authorization: `Bearer ${PAGE_TOKEN}` }
        });

        // Step 3: Tentukan ekstensi file berdasarkan mime type
        let ext = "bin"; // default fallback
        if (mimeType) {
            if (mimeType.startsWith("image/")) {
                ext = mimeType.split("/")[1] || "jpg";
            } else if (mimeType.startsWith("video/")) {
                ext = mimeType.split("/")[1] || "mp4";
            } else if (mimeType.startsWith("audio/")) {
                ext = mimeType.split("/")[1] || "mp3";
            } else if (mimeType === "application/pdf") {
                ext = "pdf";
            } else if (mimeType.includes("document") || mimeType.includes("text")) {
                ext = "doc";
            } else if (mimeType.includes("ogg")) {
                ext = "ogg"; // voice notes
            }
        }

        const fileName = generateUniqueFilename(`file.${ext}`);
        
        // Step 4: Tentukan folder berdasarkan tipe file
        let uploadDir = "uploads";
        if (mimeType?.startsWith("image/")) {
            uploadDir = "uploads"; // gambar tetap di uploads
        } else if (mimeType?.startsWith("video/")) {
            uploadDir = "uploads/videos";
        } else if (mimeType?.startsWith("audio/") || mimeType?.includes("ogg")) {
            uploadDir = "uploads/audio";
        } else if (mimeType?.includes("pdf") || mimeType?.includes("document")) {
            uploadDir = "uploads/documents";
        }

        const fullUploadPath = path.join(__dirname, "..", "public", uploadDir);
        
        // Buat folder jika belum ada
        if (!fs.existsSync(fullUploadPath)) {
            fs.mkdirSync(fullUploadPath, { recursive: true });
        }

        const filePath = path.join(fullUploadPath, fileName);

        // Step 5: Proses file berdasarkan tipe
        if (mimeType?.startsWith("image/")) {
            // Kompres gambar dengan sharp
            const imageBuffer = await sharp(response.data)
                .resize({ width: 1280 }) // Resize max lebar 1280px
                .toFormat("jpeg", { quality: 70 }) // Kompres JPEG ke kualitas 70%
                .toBuffer();
            
            fs.writeFileSync(filePath, imageBuffer);
        } else {
            // Untuk file non-gambar, simpan langsung
            fs.writeFileSync(filePath, response.data);
        }

        return `/${uploadDir}/${fileName}`;
    } catch (error) {
        console.error("❌ Error downloading media:", error);
        throw error;
    }
}

module.exports = downloadMediaFromMeta;
