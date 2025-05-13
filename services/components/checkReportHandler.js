const userRepo = require("../../repositories/userRepo");
const reportRepo = require("../../repositories/reportRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");

module.exports = async (from, step, input) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    // Langkah pertama: cek apakah sedang dalam tahap pengecekan laporan berdasarkan ID
    if (step === "ASK_REPORT_ID") {
        // Format laporan diasumsikan diawali dengan LPRAA-
        const report = await reportRepo.findBySessionId("LPRAA-" + input);

        // Setelah pengecekan, sesi direset agar kembali ke main menu
        await userRepo.resetSession(from);

        // Jika laporan tidak ditemukan, beri pesan kegagalan
        if (!report) {
            return `Beritahu ${nama} kalau no laporan LPRAA-${input} tidak ditemukan.`;
        }

        // Ambil informasi tindakan terbaru dari laporan jika tersedia
        const tindakan = report?.tindakan;

        // Tampilkan detail laporan secara terstruktur
        return (
`
Beritahu ${nama} tentang detail laporan dengan data seprti dibawah ini:

Laporan ${report.sessionId}

Lokasi: ${report.location.description}
Isi Laporan: ${report.message}

Tindakan Terbaru:
OPD Terkait: ${tindakan?.opd || "-"}
Tingkat Kedaruratan: ${tindakan?.situasi || "-"}
Status: ${tindakan?.status || "-"}
`
        );
    }

    // Jika tidak dalam kondisi ASK_REPORT_ID, reset sesi dan kembali ke menu utama
    await userRepo.resetSession(from);
    return `Beri tahu ${nama} memilih menu yang tidak dikenali. Silakan pilih menu yang tersedia. atau ketik 'menu' untuk melihat menu.`;
};
