const mainMenuHandler = require("./components/mainMenuHandler");
const signupHandler = require("./components/signupHandler");
const createReportHandler = require("./components/createReportHandler");
const checkReportHandler = require("./components/checkReportHandler");

const userRepo = require("../repositories/userRepo");
const tindakanRepo = require("../repositories/tindakanRepo");
const userProfileRepo = require("../repositories/userProfileRepo");
const { startContext } = require("../utils/openAiHelper");

const response = require("../utils/response");
const responseError = require("../utils/responseError");

exports.handleUserMessage = async ({ from, message }) => {
    try {
        const user = await userProfileRepo.findByFrom(from);
        const nama = user?.name || "Warga";

        const GeminiStartContext = await startContext(message);
        let session = await userRepo.getOrCreateSession(from);
        if (session.mode === "manual") return null;

        const input = typeof message === "string" ? message.trim().toLowerCase() : message;
        const step = session.step;

        // === GREETING ===
        if (step === "MAIN_MENU" && !session.currentAction) {
            const GeminiStartContext = await startContext(input);
            if (GeminiStartContext === "true") {
                return response.greetingMessage(nama);
            }
        }

        // === RESET ===
        if (input === "menu" || input === "reset") {
            await userRepo.resetSession(from);
            return response.resetMessage(nama);
        }

        // === HANDLE RATING ===
        if (step === "WAITING_FOR_RATING") {
            const rating = parseInt(input);
            const tindakanId = session.pendingFeedbackFor?.[0];

            if (isNaN(rating) || rating < 1 || rating > 5) {
                return response.invalidRating(nama);
            }

            const tindakan = await tindakanRepo.findById(tindakanId);
            if (!tindakan) return response.ratingError(nama);

            tindakan.rating = rating;
            await tindakan.save();

            session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
            session.step = "MAIN_MENU";
            session.currentAction = null;
            await session.save();

            return response.successRating(nama, rating);
        }

        // === HANDLE KONFIRMASI PENYELESAIAN LAPORAN ===
        if (session.pendingFeedbackFor && session.pendingFeedbackFor.length > 0) {
            const tindakanId = session.pendingFeedbackFor[0];
            const tindakan = await tindakanRepo.findById(tindakanId);
            const sessionId = tindakan?.report.sessionId || "???";
            const kesimpulan = tindakan?.kesimpulan || "Tidak ada keterangan";

            // Laporan Ditolak
            if (tindakan?.status === "Ditolak" && tindakan.feedbackStatus === "Sudah Ditanya") {
                tindakan.feedbackStatus = "Selesai Ditolak";
                await tindakan.save();

                session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
                session.step = "MAIN_MENU";
                await session.save();

                return response.tindakanDitolakMessage(nama, sessionId, kesimpulan);
            }

            // Laporan Selesai Normal (Tanya Puas/Belum)
            if (["puas", "belum"].includes(input)) {
                if (tindakan?.status === "Selesai Penanganan" && tindakan.feedbackStatus === "Sudah Ditanya") {
                    let reply;

                    if (input === "puas") {
                        tindakan.feedbackStatus = "Sudah Jawab Beres";
                        tindakan.status = "Selesai Pengaduan";
                        await tindakan.save();

                        session.step = "WAITING_FOR_RATING";
                        await session.save();

                        reply = response.feedbackPuas(nama, sessionId);
                    } else {
                        tindakan.feedbackStatus = "Sudah Jawab Belum Beres";
                        tindakan.status = "Proses OPD Terkait";
                        await tindakan.save();

                        session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
                        session.step = "MAIN_MENU";
                        await session.save();

                        reply = response.feedbackBelum(nama, sessionId, session.pendingFeedbackFor.length);
                        if (session.pendingFeedbackFor.length > 0) {
                            reply += "\n\n" + response.pendingFeedback(nama);
                        }
                    }

                    return reply;
                }
            }

            // Jika user belum balas puas/belum, ingatkan
            return response.pendingFeedback(nama);
        }

        // === MENU UTAMA & LANJUTAN ===
        if (!session.currentAction && step === "MAIN_MENU") {
            return await mainMenuHandler(from, input);
        }

        if (session.currentAction === "signup") {
            return await signupHandler(from, step, input);
        }

        if (session.currentAction === "create_report") {
            return await createReportHandler(from, step, input);
        }

        if (session.currentAction === "check_report") {
            return await checkReportHandler(from, step, input);
        }

        // === DEFAULT: Reset sesi jika alur tidak cocok ===
        await userRepo.resetSession(from);
        return response.invalidMenuMessage(nama);

    } catch (err) {
        console.error("🚨 Error in handleUserMessage:", err);

        try {
            // Coba ambil nama user lagi untuk fallback
            const user = await userProfileRepo.findByFrom(from);
            const nama = user?.name || "Warga";
            return responseError.defaultErrorMessage(nama);
        } catch {
            return "Terjadi kesalahan. Silakan coba lagi nanti.";
        }
    }
};