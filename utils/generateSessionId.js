const Report = require("../models/Report");

async function generateSessionId(from) {
    const phoneSuffix = from?.slice(-4) || "0000"; // 4 digit terakhir nomor
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const prefix = `${phoneSuffix}${random}`; // jadi 8 digit

    // Hitung semua laporan di DB
    const totalReports = await Report.countDocuments(); // jumlah global

    const order = (totalReports + 1).toString().padStart(4, "0"); // 0001, 0002, dst

    return `${prefix}${order}`; // hasil akhir: 12 digit
}

module.exports = generateSessionId;