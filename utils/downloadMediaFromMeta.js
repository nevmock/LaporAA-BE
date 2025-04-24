const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const PAGE_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN; // simpan token di .env

async function downloadMediaFromMeta(mediaId) {
    // Step 1: Get URL dari media ID
    const { data: metaInfo } = await axios.get(`https://graph.facebook.com/v18.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${PAGE_TOKEN}` }
    });

    const mediaUrl = metaInfo.url;

    // Step 2: Download file
    const response = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
        headers: { Authorization: `Bearer ${PAGE_TOKEN}` }
    });

    const ext = metaInfo.mime_type === "image/png" ? "png" : "jpg";
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = path.join(__dirname, "..", "public", "uploads", fileName);

    fs.writeFileSync(filePath, response.data);
    return `/uploads/${fileName}`; // path untuk frontend
}

module.exports = downloadMediaFromMeta;
