const userRepo = require("../../repositories/userRepo");
const reportRepo = require("../../repositories/reportRepo");

module.exports = async (from, step, input) => {
    // Langkah pertama: cek apakah sedang dalam tahap pengecekan laporan berdasarkan ID
    if (step === "ASK_REPORT_ID") {
        // Format laporan diasumsikan diawali dengan LPRAA-
        const report = await reportRepo.findBySessionId("LPRAA-" + input);

        // Setelah pengecekan, sesi direset agar kembali ke main menu
        await userRepo.resetSession(from);

        // Jika laporan tidak ditemukan, beri pesan kegagalan
        if (!report) {
            return `Beritahu user kalau no laporan ${input} tidak ditemukan.`;
        }

        // Ambil informasi tindakan terbaru dari laporan jika tersedia
        const tindakan = report?.tindakan;

        // Tampilkan detail laporan secara terstruktur
        return (
`
Beritahu user tentang detail laporan dengan data seprti dibawah ini:

Laporan ${report.sessionId}

Lokasi: ${report.location.description}
Isi Laporan: ${report.message}

Tindakan Terbaru:
• OPD Terkait: ${tindakan?.opd || "-"}
• Tingkat Kedaruratan: ${tindakan?.situasi || "-"}
• Status: ${tindakan?.status || "-"}
`
        );
    }

    // Jika tidak dalam kondisi ASK_REPORT_ID, reset sesi dan kembali ke menu utama
    await userRepo.resetSession(from);
    return `ini adalah default jika command tidak dikenali, ucapkan salam juga ya dan Beri tahu user untuk memilih:\n1. Buat laporan baru\n2. Cek status laporan input nya harus 1 atau 2, jelaskan juga ke usernya dengan singkat`;
};
