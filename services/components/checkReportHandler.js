const userRepo = require("../../repositories/userRepo");
const reportRepo = require("../../repositories/reportRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const checkReportResponse = require("../responseMessage/checkReportResponse");

module.exports = async (from, step, input) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga/i";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    // STEP: Pengecekan Laporan
    if (step === "ASK_REPORT_ID") {
        const msg = input?.toString().toLowerCase();

        // Jika user ingin kembali ke menu utama
        if (msg === "menu" || msg === "kembali") {
            await userRepo.resetSession(from);
            return checkReportResponse.kembaliKeMenu(sapaan, nama);
        }

        // Format laporan diasumsikan LPRAA-{kode}
        const sessionId = `LPRAA-${input}`;
        const report = await reportRepo.findBySessionId(sessionId);
        const nomorLaporan = sessionId.split("-")[1];

        // Jika tidak ditemukan → tetap di ASK_REPORT_ID agar user bisa coba lagi
        if (!report) {
            return checkReportResponse.laporanTidakDitemukan(sapaan, nama, nomorLaporan);
        }

        // Jika ditemukan → tampilkan detail lalu reset sesi
        await userRepo.resetSession(from);

        return checkReportResponse.detailLaporan(sapaan, nama, nomorLaporan, report);
    }

    // Catch-all fallback
    await userRepo.resetSession(from);
    return checkReportResponse.handlerDefault();
};
