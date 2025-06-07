const mainMenuHandler = require("./components/mainMenuHandler");
const signupHandler = require("./components/signupHandler");
const createReportHandler = require("./components/createReportHandler");
const checkReportHandler = require("./components/checkReportHandler");
const userRepo = require("../repositories/userRepo");
const tindakanRepo = require("../repositories/tindakanRepo");
const userProfileRepo = require("../repositories/userProfileRepo");
const botFlowResponse = require("./responseMessage/botFlowResponse");
const spamHandler = require("./components/spamHandler");

const { combinedContext } = require("../utils/openAiHelper");

exports.handleUserMessage = async ({ from, message, sendReply }) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    let session = await userRepo.getOrCreateSession(from);

    const input = typeof message === "string" ? message.trim().toLowerCase() : message;
    const step = session.step;

    // Check combined context
    const context = await combinedContext(input);
    if (context === "greeting") {
        // Redirect to mainMenuHandler immediately
        return mainMenuHandler(from, input, sendReply);
    }

    // Bypass spam check for first message or implement better spam logic
    if (!session || !session.lastMessageTimestamp) {
        // First message, skip spam check
        session.lastMessageTimestamp = Date.now();
        await session.save();
        return mainMenuHandler(from, input, sendReply);
    }

    // Check if user is in manual mode, hold bot responses
    if (session.mode === "manual") {
        const now = Date.now();
        if (session.manualModeUntil && now > session.manualModeUntil) {
            // Reset manual mode after cooldown
            session.mode = "bot";
            session.manualModeUntil = null;
            await session.save();
        } else {
            const waitSeconds = Math.ceil((session.manualModeUntil - now) / 1000);
            return sendReply(from, `Anda sedang dalam mode manual. Mohon tunggu selama ${waitSeconds} detik lagi sebelum bot kembali aktif.`);
        }
    }

/* Removed deduplication in botFlowService as per user request */

const sendReplyDedup = async (from, message) => {
    return sendReply(from, message);
};

    const messageHandler = async () => {
        // Handle Rating setelah laporan selesai
        if (step === "WAITING_FOR_RATING") {
            const rating = parseInt(input);
            const tindakanId = session.pendingFeedbackFor?.[0];

            if (isNaN(rating) || rating < 1 || rating > 5) {
                return sendReplyDedup(from, botFlowResponse.ratingInvalid(sapaan, nama));
            }

            try {
                const tindakan = await tindakanRepo.findById(tindakanId);
                if (!tindakan) {
                    return sendReplyDedup(from, botFlowResponse.laporanTidakDitemukan(sapaan, nama));
                }

                tindakan.rating = rating;
                await tindakan.save();

                session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
                session.step = "MAIN_MENU";
                session.currentAction = null;
                await session.save();

                return sendReplyDedup(from, botFlowResponse.ratingSuccess(sapaan, nama, rating));
            } catch (err) {
                console.error("Gagal menyimpan rating:", err);
                return sendReplyDedup(from, botFlowResponse.gagalSimpanRating());
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

                return sendReplyDedup(from, botFlowResponse.laporanDitolak(sapaan, nama, tindakan.report.sessionId, tindakan.kesimpulan));
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
                        // Check if this is the first reprocess or second
                        if (!tindakan.hasBeenReprocessed) {
                            // First time user says "belum" - allow reprocess
                            tindakan.feedbackStatus = "Sudah Jawab Belum Beres";
                            tindakan.status = "Proses OPD Terkait";
                            tindakan.hasBeenReprocessed = true;
                            await tindakan.save();

                            session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
                            session.step = "MAIN_MENU";
                            await session.save();

                            reply = botFlowResponse.belumReply(sapaan, nama, tindakan.report.sessionId, session.pendingFeedbackFor.length);
                        } else {
                            // Second time user says "belum" - finalize report
                            tindakan.feedbackStatus = "Selesai Pengaduan";
                            tindakan.status = "Selesai Pengaduan";
                            tindakan.rating = 5; // auto set rating to 5
                            await tindakan.save();

                            session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
                            session.step = "MAIN_MENU";
                            await session.save();

                            reply = botFlowResponse.finalizeAndAskNewReport(sapaan, nama);
                        }
                    }
                    return reply;
                }
            }
            return sendReplyDedup(from, botFlowResponse.pendingKonfirmasi(sapaan, nama));
        }

        // Handle Main Menu dan Langkah-langkah Bot
        if (!session.currentAction && step === "MAIN_MENU") return mainMenuHandler(from, input, sendReplyDedup);
        if (session.currentAction === "signup") return signupHandler(from, step, input, sendReplyDedup);
        if (session.currentAction === "create_report") return createReportHandler(from, step, input, sendReplyDedup);
        if (session.currentAction === "check_report") return checkReportHandler(from, step, input, sendReplyDedup);

        // Default Reset kalau semua gak cocok
        await userRepo.resetSession(from);
    };

    if (spamHandler.isSpam(from)) {
        // Set user session mode to manual on spam detection
        session.mode = "manual";
        session.manualModeUntil = Date.now() + 10000; // 10 seconds cooldown
        await session.save();

        return spamHandler.handleSpam(from, messageHandler, sendReplyDedup);
    } else {
        // Reset mode to bot if not spam and cooldown expired
        if (session.mode === "manual") {
            const now = Date.now();
            if (!session.manualModeUntil || now > session.manualModeUntil) {
                session.mode = "bot";
                session.manualModeUntil = null;
                await session.save();
            }
        }
        return messageHandler();
    }
};
