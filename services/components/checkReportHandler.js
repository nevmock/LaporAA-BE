const userRepo = require("../../repositories/userRepo");
const reportRepo = require("../../repositories/reportRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const checkReportResponse = require("../responseMessage/checkReportResponse");

const spamHandler = require("./spamHandler");

module.exports = async (from, step, input, sendReply) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga/i";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    const messageHandler = async () => {
        // STEP: Pengecekan Laporan
        if (step === "ASK_REPORT_ID") {
            const msg = input?.toString().toLowerCase();

            // Jika user ingin kembali ke menu utama
            if (msg === "menu" || msg === "kembali") {
                await userRepo.resetSession(from);
                return sendReply(from, checkReportResponse.kembaliKeMenu(sapaan, nama));
            }

            // Format laporan diasumsikan LPRAA-{kode}
            const sessionId = `LPRAA-${input}`;
            const report = await reportRepo.findBySessionId(sessionId);
            const nomorLaporan = sessionId.split("-")[1];

            // Jika tidak ditemukan → tetap di ASK_REPORT_ID agar user bisa coba lagi
            if (!report) {
                return sendReply(from, checkReportResponse.laporanTidakDitemukan(sapaan, nama, nomorLaporan));
            }

            // Jika ditemukan → tampilkan detail lalu reset sesi
            await userRepo.resetSession(from);

            return sendReply(from, checkReportResponse.detailLaporan(sapaan, nama, nomorLaporan, report));
        }

        // Catch-all fallback
        await userRepo.resetSession(from);
        return sendReply(from, checkReportResponse.handlerDefault());
    };

    if (spamHandler.isSpam(from)) {
        return spamHandler.handleSpam(from, messageHandler, sendReply);
    } else {
        return messageHandler();
    }
};
