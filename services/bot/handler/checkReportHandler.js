const userRepo = require("../../repositories/userRepo");
const reportRepo = require("../../repositories/reportRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const response = require("../../utils/response");
const responseError = require("../../utils/responseError");

/**
 * Menangani alur pengecekan status laporan berdasarkan session ID.
 * 
 * @param {string} from - Nomor WhatsApp pengguna
 * @param {string} step - Langkah aktif dalam session
 * @param {string} input - Input dari pengguna (ID laporan atau perintah navigasi)
 * @returns {Promise<string>} - Balasan untuk pengguna
 */
module.exports = async (from, step, input) => {
    try {
        const user = await userProfileRepo.findByFrom(from);
        const nama = user?.name || "Warga";

        // === Step: pengguna diminta memasukkan ID laporan ===
        if (step === "ASK_REPORT_ID") {
            const msg = input?.toString().trim().toLowerCase();

            // Jika pengguna mengetik 'menu' atau 'kembali', reset session
            if (msg === "menu" || msg === "kembali") {
                await userRepo.resetSession(from);
                return response.checkReport.backToMenu(nama);
            }

            const sessionId = `LPRAA-${input}`;
            const nomorLaporan = sessionId.split("-")[1];
            const report = await reportRepo.findBySessionId(sessionId);

            // Jika laporan tidak ditemukan
            if (!report) {
                return response.checkReport.reportNotFound(nama, nomorLaporan);
            }

            // Ambil tindakan terbaru jika ada
            const tindakan = report?.tindakan;

            // Reset session setelah pengecekan selesai
            await userRepo.resetSession(from);

            return response.checkReport.reportDetail(nama, nomorLaporan, report, tindakan);
        }

        // Fallback jika step tidak dikenali
        await userRepo.resetSession(from);
        return response.checkReport.unknownStep(nama);

    } catch (err) {
        console.error("Error di checkReportHandler:", err);

        try {
            const user = await userProfileRepo.findByFrom(from);
            const nama = user?.name || "Warga";
            return responseError.defaultErrorMessage(nama);
        } catch {
            return "Terjadi kesalahan. Silakan coba lagi nanti.";
        }
    }
};