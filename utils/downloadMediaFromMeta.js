const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { generateUniqueFilename } = require("./fileRenameHelper");

const PAGE_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function downloadMediaFromMeta(mediaId) {
    // Step 1: Ambil URL file
    const { data: metaInfo } = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${PAGE_TOKEN}` }
    });

    const mediaUrl = metaInfo.url;

    // Step 2: Download file (as buffer)
    const response = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
        headers: { Authorization: `Bearer ${PAGE_TOKEN}` }
    });

    const ext = metaInfo.mime_type === "image/png" ? "png" : "jpg";
    const fileName = generateUniqueFilename(`file.${ext}`);
    const filePath = path.join(__dirname, "..", "public", "uploads", fileName);

    // Step 3: Kompres gambar dengan sharp
    const imageBuffer = await sharp(response.data)
        .resize({ width: 1280 }) // Resize max lebar 1280px (bisa diubah)
        .toFormat("jpeg", { quality: 70 }) // Kompres JPEG ke kualitas 70%
        .toBuffer();

    // Step 4: Simpan file
    fs.writeFileSync(filePath, imageBuffer);

    return `/uploads/${fileName}`;
}

module.exports = downloadMediaFromMeta;
