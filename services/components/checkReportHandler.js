const userRepo = require("../../repositories/userRepo");
const reportRepo = require("../../repositories/reportRepo");

module.exports = async (from, step, input) => {
    if (step === "ASK_REPORT_ID") {
        const report = await reportRepo.findBySessionId("LPRAA-"+input);
        await userRepo.resetSession(from);

        if (!report) {
            return `Laporan dengan kode *${input}* tidak ditemukan.`;
        }

        const tindakan = report?.tindakan; // Tindakan terbaru (jika ada)

        return (`
📝 *Detail Laporan ${report.sessionId}*
        
📍 *Lokasi:* ${report.location.description}
💬 *Keluhan:* ${report.message}

📌 *Tindakan Terbaru:*
• Kesimpulan: ${tindakan?.kesimpulan || "-"}
• OPD Terkait: ${tindakan?.opd || "-"}
• Situasi: ${tindakan?.situasi || "-"}
• Status: ${tindakan?.status || "-"}

Ketik apa saja untuk kembali ke menu utama.
        `);
    }

    await userRepo.resetSession(from);
    return `Sesi Anda sudah berakhir. Silahkan balas pesan ini untuk kembali ke menu awal.`;
};
