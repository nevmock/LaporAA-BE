const mainMenuHandler = require("./components/mainMenuHandler");
const signupHandler = require("./components/signupHandler");
const createReportHandler = require("./components/createReportHandler");
const checkReportHandler = require("./components/checkReportHandler");
const feedbackHandler = require("./components/feedbackHandler");
const ratingHandler = require("./components/ratingHandler");
const userRepo = require("../repositories/userRepo");
const userProfileRepo = require("../repositories/userProfileRepo");
const botFlowResponse = require("./responseMessage/botFlowResponse");
const { combinedContext } = require("../utils/openAiHelper");

exports.handleUserMessage = async ({ from, message, sendReply }) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    let session = await userRepo.getOrCreateSession(from);
    const input = typeof message === "string" ? message.trim().toLowerCase() : message;
    const step = session.step;

    const context = await combinedContext(input);

    // === Greeting check untuk reset session dan tampilkan menu utama ===
    if (step === "MAIN_MENU" && !session.currentAction && context === "greeting") {
        await userRepo.resetSession(from);
        return mainMenuHandler(from, input, sendReply);
    }

    // === Handle manual mode ===
    if (session.mode === "manual") {
        const now = Date.now();
        if (session.manualModeUntil && now > session.manualModeUntil) {
            session.mode = "bot";
            session.manualModeUntil = null;
            await session.save();
        } else {
            const waitSeconds = Math.ceil((session.manualModeUntil - now) / 1000);
            return sendReply(from, `Anda sedang dalam mode manual. Mohon tunggu selama ${waitSeconds} detik lagi sebelum bot kembali aktif.`);
        }
    }

    // === Feedback flow ===
    if (session.pendingFeedbackFor?.length > 0) {
        const handled = await feedbackHandler({ from, input, session, sapaan, nama, sendReply });
        if (handled) return handled;
    }

    // === Rating flow ===
    if (step === "WAITING_FOR_RATING") {
        const handled = await ratingHandler({ from, input, session, sapaan, nama, sendReply });
        if (handled) return handled;
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