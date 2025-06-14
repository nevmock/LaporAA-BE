const Report = require("../models/Report"); // ganti sesuai path kamu

async function generateSessionId(from) {
    const phoneSuffix = from?.slice(-4) || "0000"; // 4 digit terakhir
    const random = Math.floor(1000 + Math.random() * 9000); // random 4 digit
    const prefix = `${phoneSuffix}${random}`; // 8 digit awal

    // Cari sessionId yang sudah ada dengan prefix ini
    const regex = new RegExp(`^${prefix}\\d{4}$`);
    const existingCount = await Report.countDocuments({ sessionId: { $regex: regex } });

    const order = (existingCount + 1).toString().padStart(4, "0"); // 0001, 0002, dst

    return `${prefix}${order}`; // 12 digit total
}

module.exports = generateSessionId;
