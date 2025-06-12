const mainMenuHandler = require("./components/mainMenuHandler");
const signupHandler = require("./components/signupHandler");
const createReportHandler = require("./components/createReportHandler");
const checkReportHandler = require("./components/checkReportHandler");
const userRepo = require("../repositories/userRepo");
const userProfileRepo = require("../repositories/userProfileRepo");
const tindakanRepo = require("../repositories/tindakanRepo");
const tindakanResponse = require("./responseMessage/tindakanResponse");
const botFlowResponse = require("./responseMessage/botFlowResponse");
const { combinedContext } = require("../utils/openAiHelper");

exports.handleUserMessage = async ({ from, message, sendReply }) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    let session = await userRepo.getOrCreateSession(from);
    const ratingInput = message;
    const input = typeof message === "string" ? message.trim().toLowerCase() : message;
    const step = session.step;

    const context = await combinedContext(input);

    // === Greeting check untuk reset session dan tampilkan menu utama ===
    if ((step === "MAIN_MENU" && !session.currentAction && input === "menu") || (step === "MAIN_MENU" && !session.currentAction && context === "greeting")) {
        await userRepo.resetSession(from);
        return mainMenuHandler(from, input, sendReply);
    }

    // if ((context === "terimakasih")) {
    //     const res1 = botFlowResponse.terimakasihResponse(sapaan, nama);
    //     return sendReply(from, res1);
    // }

    // === Handle manual mode ===
    if (session.mode === "manual") {
        const now = new Date();

        if (session.manualModeUntil && now > session.manualModeUntil) {
            session.mode = "bot";
            session.manualModeUntil = null;
            await session.save();
        } else {
            const waitSeconds = Math.ceil((session.manualModeUntil.getTime() - now.getTime()) / 1000);
            return sendReply(from, `Anda sedang dalam mode manual. Mohon tunggu selama ${waitSeconds} detik lagi sebelum bot kembali aktif.`);
        }
    }

    // === Rating flow ===
    if (step === "WAITING_FOR_RATING") {
        const rating = parseInt(ratingInput || 5);
        const tindakanId = session.pendingFeedbackFor?.[0];
        const tindakan = await tindakanRepo.findById(tindakanId);
        const sessionId = tindakan.report?.sessionId || "Tidak diketahui";

        if (isNaN(rating) || rating < 1 || rating > 5) {
            return sendReply(from, botFlowResponse.ratingInvalid(sapaan, nama));
        }

        const replyFunc = tindakanResponse[`puasReply${rating}`];
        if (typeof replyFunc !== "function") {
            console.warn(`Function puasReply${rating} tidak ditemukan di botFlowResponse`);
            return sendReply(from, botFlowResponse.ratingInvalid(sapaan, nama));
        }

        try {
            const tindakan = await tindakanRepo.findById(tindakanId);
            if (!tindakan) {
                return sendReply(from, botFlowResponse.laporanTidakDitemukan(sapaan, nama));
            }

            tindakan.rating = rating;
            await tindakan.save();

            session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
            session.step = "MAIN_MENU";
            session.currentAction = null;
            await session.save();

            const replyMessage = replyFunc(sapaan, nama, sessionId);
            return sendReply(from, replyMessage);
        } catch (err) {
            console.error("Gagal menyimpan rating:", err);
            return sendReply(from, botFlowResponse.gagalSimpanRating());
        }
    }

    // === Feedback flow ===
    if (session.pendingFeedbackFor && session.pendingFeedbackFor?.length > 0) {
        const tindakanId = session.pendingFeedbackFor[0];
        const tindakan = await tindakanRepo.findById(tindakanId);

        if (tindakan?.status === "Ditolak" && tindakan.feedbackStatus === "Sudah Ditanya") {
            tindakan.feedbackStatus = "Selesai Ditolak";
            await tindakan.save();

            session.pendingFeedbackFor.shift();
            session.step = "MAIN_MENU";
            await session.save();

            const sessionId = tindakan.report?.sessionId || "Tidak diketahui";
            return sendReply(from, botFlowResponse.laporanDitolak(sapaan, nama, sessionId, tindakan.kesimpulan));
        }

        if (["puas", "belum"].includes(input)) {
            const sessionId = tindakan.report?.sessionId || "Tidak diketahui";

            if (tindakan?.status === "Selesai Penanganan" && tindakan.feedbackStatus === "Sudah Ditanya") {
                let reply;

                if (input === "puas") {
                    tindakan.feedbackStatus = "Sudah Jawab Beres";
                    tindakan.status = "Selesai Pengaduan";
                    await tindakan.save();

                    session.step = "WAITING_FOR_RATING";
                    await session.save();

                    reply = botFlowResponse.puasReply(sapaan, nama, sessionId);
                } else {
                    if (!tindakan.hasBeenReprocessed) {
                        tindakan.feedbackStatus = "Sudah Jawab Belum Beres";
                        tindakan.status = "Proses OPD Terkait";
                        tindakan.hasBeenReprocessed = true;
                        await tindakan.save();

                        session.pendingFeedbackFor.shift();
                        session.step = "MAIN_MENU";
                        await session.save();

                        reply = botFlowResponse.belumReply(sapaan, nama, sessionId, session.pendingFeedbackFor.length);
                    } else {
                        tindakan.feedbackStatus = "Sudah Jawab Beres";
                        tindakan.status = "Selesai Pengaduan";
                        tindakan.rating = 5;
                        await tindakan.save();

                        session.pendingFeedbackFor.shift();
                        session.step = "MAIN_MENU";
                        await session.save();

                        reply = tindakanResponse.finalizeAndAskNewReport(sapaan, nama);
                    }
                }

                return sendReply(from, reply);
            }
        }

        return sendReply(from, botFlowResponse.pendingKonfirmasi(sapaan, nama));
    }

    // === Routing berdasarkan currentAction ===
    if (!session.currentAction && step === "MAIN_MENU") {
        return mainMenuHandler(from, input, sendReply);
    }

    if (session.currentAction === "signup") {
        return signupHandler(from, step, input, sendReply);
    }

    if (session.currentAction === "create_report") {
        return createReportHandler(from, step, input, sendReply);
    }

    if (session.currentAction === "check_report") {
        return checkReportHandler(from, step, input, sendReply);
    }

    // === Fallback: Reset session jika tidak cocok ===
    await userRepo.resetSession(from);
    return sendReply(from, botFlowResponse.mainSapaan());
};