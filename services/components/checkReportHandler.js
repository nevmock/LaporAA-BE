const userRepo = require("../../repositories/userRepo");
const reportRepo = require("../../repositories/reportRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");

module.exports = async (from, step, input) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";

    // STEP: Pengecekan Laporan
    if (step === "ASK_REPORT_ID") {
        const msg = input?.toString().toLowerCase();

        // Jika user ingin kembali ke menu utama
        if (msg === "menu" || msg === "kembali") {
            await userRepo.resetSession(from);
            return `Sapa ${nama}. dan arahkan ${nama} apakah ingin membuat laporan atau cek status laporan?`;
        }

        // Format laporan diasumsikan LPRAA-{kode}
        const sessionId = `LPRAA-${input}`;
        const report = await reportRepo.findBySessionId(sessionId);
        const nomorLaporan = sessionId.split("-")[1];

        // Jika tidak ditemukan → tetap di ASK_REPORT_ID agar user bisa coba lagi
        if (!report) {
            return `Beritahu ${nama} kalau nomor laporan *${nomorLaporan}* tidak ditemukan.
            Silakan cek kembali dan kirim ulang nomornya, atau ketik *menu* untuk kembali ke menu utama.`;
        }

        // Jika ditemukan → tampilkan detail lalu reset sesi
        const tindakan = report?.tindakan;

        await userRepo.resetSession(from);

        return (
`Beritahu ${nama} tentang detail laporan berikut:\n
🆔 *Laporan ${nomorLaporan}*

📍 Lokasi: ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}
📅 Tanggal: ${report.createdAt.toLocaleDateString("id-ID")}
⏰ Waktu: ${report.createdAt.toLocaleTimeString("id-ID")}
📝 Isi Laporan: ${report.message}

📌 Tindakan Terbaru:
• OPD Terkait: ${tindakan?.opd || "-"}
• Tingkat Kedaruratan: ${tindakan?.situasi || "-"}
• Status: ${tindakan?.status || "-"}
• Disposisi: ${tindakan?.disposisi || "-"}

Mohon Menunggu, kami akan segera menindaklanjuti laporan Anda.`
        );
    }

    // Catch-all fallback
    await userRepo.resetSession(from);
    return `Beritahu ${nama} bahwa pilihan menu tidak dikenali. Ketik *menu* untuk melihat layanan yang tersedia.`;
};
