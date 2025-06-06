const mainMenuHandler = require("./components/mainMenuHandler");
const signupHandler = require("./components/signupHandler");
const createReportHandler = require("./components/createReportHandler");
const checkReportHandler = require("./components/checkReportHandler");
const userRepo = require("../repositories/userRepo");
const tindakanRepo = require("../repositories/tindakanRepo");
const userProfileRepo = require("../repositories/userProfileRepo");
const { startContext } = require("../utils/openAiHelper");
const botFlowResponse = require("./responseMessage/botFlowResponse");

exports.handleUserMessage = async ({ from, message }) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";
    const GeminiStartContext = await startContext(message);

    let session = await userRepo.getOrCreateSession(from);
    if (session.mode === "manual") return null;

    const input = typeof message === "string" ? message.trim().toLowerCase() : message;
    const step = session.step;

    if (step === "MAIN_MENU" && GeminiStartContext === "true" ) {
        return botFlowResponse.mainSapaan(sapaan, nama);
    }

    // Reset session jika user ketik 'menu' atau 'reset'
    if (input === "menu" || input === "reset") {
        await userRepo.resetSession(from);
        return botFlowResponse.mainSapaan(sapaan, nama);
    }

    // Handle Rating setelah laporan selesai
    if (step === "WAITING_FOR_RATING") {
        const rating = parseInt(input);
        const tindakanId = session.pendingFeedbackFor?.[0];

        if (isNaN(rating) || rating < 1 || rating > 5) {
            return botFlowResponse.ratingInvalid(sapaan, nama);
        }

        try {
            const tindakan = await tindakanRepo.findById(tindakanId);
            if (!tindakan) {
                return botFlowResponse.laporanTidakDitemukan(sapaan, nama);
            }

            tindakan.rating = rating;
            await tindakan.save();

            session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
            session.step = "MAIN_MENU";
            session.currentAction = null;
            await session.save();

            return botFlowResponse.ratingSuccess(sapaan, nama, rating);
        } catch (err) {
            console.error("Gagal menyimpan rating:", err);
            return botFlowResponse.gagalSimpanRating();
        }
    }

    // Handle Konfirmasi Penyelesaian Laporan
    if (session.pendingFeedbackFor && session.pendingFeedbackFor.length > 0) {
        const tindakanId = session.pendingFeedbackFor[0];
        const tindakan = await tindakanRepo.findById(tindakanId);

        // Kasus laporan Ditolak
        if (tindakan?.status === "Ditolak" && tindakan.feedbackStatus === "Sudah Ditanya") {
            // Tandai laporan sebagai selesai tanpa rating
            tindakan.feedbackStatus = "Selesai Ditolak";
            await tindakan.save();

            session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
            session.step = "MAIN_MENU";
            await session.save();

            return botFlowResponse.laporanDitolak(sapaan, nama, tindakan.report.sessionId, tindakan.kesimpulan);
        }

        // Kasus laporan selesai normal (dengan rating)
        if (["puas", "belum"].includes(input)) {
            if (tindakan?.status === "Selesai Penanganan" && tindakan.feedbackStatus === "Sudah Ditanya") {
                let reply;

                if (input === "puas") {
                    tindakan.feedbackStatus = "Sudah Jawab Beres";
                    tindakan.status = "Selesai Pengaduan";
                    await tindakan.save();

                    session.step = "WAITING_FOR_RATING";
                    await session.save();

                    reply = botFlowResponse.puasReply(sapaan, nama, tindakan.report.sessionId);
                } else {
                    tindakan.feedbackStatus = "Sudah Jawab Belum Beres";
                    tindakan.status = "Proses OPD Terkait";
                    await tindakan.save();

                    session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
                    session.step = "MAIN_MENU";
                    await session.save();

                    reply = botFlowResponse.belumReply(sapaan, nama, tindakan.report.sessionId, session.pendingFeedbackFor.length);
                }
                return reply;
            }
        }
        return botFlowResponse.pendingKonfirmasi(sapaan, nama);
    }

    // Handle Main Menu dan Langkah-langkah Bot
    if (!session.currentAction && step === "MAIN_MENU") return await mainMenuHandler(from, input);
    if (session.currentAction === "signup") return await signupHandler(from, step, input);
    if (session.currentAction === "create_report") return await createReportHandler(from, step, input);
    if (session.currentAction === "check_report") return await checkReportHandler(from, step, input);

    // Default Reset kalau semua gak cocok
    await userRepo.resetSession(from);
};
