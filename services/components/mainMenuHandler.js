const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const reportRepo = require("../../repositories/reportRepo");
const { combinedContext } = require("../../utils/openAiHelper");
const mainMenuResponse = require("../responseMessage/mainMenuResponse");
const botFlowResponse = require("../responseMessage/botFlowResponse");

module.exports = async (from, input, sendReply) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" :
        jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    const lowerInput = typeof input === "string" ? input?.toLowerCase?.().trim() : "";
    let session = await userRepo.getOrCreateSession(from);

    const context = await combinedContext(input);
    const activeReports = await reportRepo.findActiveReportsByFrom(from);

    const promptSignup = async () => {
        await userRepo.updateSession(from, {
            currentAction: "signup",
            step: "ASK_NAME",
        });
        return sendReply(from, mainMenuResponse.belumTerdaftar());
    };

    const promptAngrySignup = async () => {
        await userRepo.updateSession(from, {
            currentAction: "signup",
            step: "ASK_NAME",
        });
        return sendReply(from, mainMenuResponse.angryComplaintSignup());
    };

    const promptMengeluhSignup = async () => {
        await userRepo.updateSession(from, {
            currentAction: "signup",
            step: "ASK_NAME",
        });
        return sendReply(from, mainMenuResponse.complaintSignup());
    };

    // ✅ Reset session dan kirim menu utama
    if (lowerInput === "menu" || lowerInput === "kembali" || lowerInput === "reset") {
        await userRepo.resetSession(from);
        const res1 = botFlowResponse.mainSapaan(sapaan, nama);
        return sendReply(from, res1);
    }

    if ((session.step === "MAIN_MENU" && context === "terimakasih")) {
        const res1 = botFlowResponse.terimakasihResponse(sapaan, nama);
        return sendReply(from, res1);
    }

    // ✅ Greetings
    if (session.step === "MAIN_MENU" && session.currentAction === null && (context === "greeting" && process.env.AI_CONTEXT_READER)) {
        await userRepo.resetSession(from);
        const res1 = botFlowResponse.mainSapaan(sapaan, nama);
        return sendReply(from, res1);
    }

    // ✅ Cek status laporan
    if (session.step === "MAIN_MENU" && input === 2 || (context === "check_report" && process.env.AI_CONTEXT_READER)) {
        if (!user) return promptSignup();

        await userRepo.updateSession(from, {
            currentAction: "check_report",
            step: "ASK_REPORT_ID",
        });

        return sendReply(from, mainMenuResponse.mintaIdLaporan(sapaan, nama));
    }

    // ✅ Buat laporan baru
    if (session.step === "MAIN_MENU" && input === 1 || (context === "new_report" && process.env.AI_CONTEXT_READER)) {
        if (!user) return promptSignup();

        // Validasi: cek jumlah laporan aktif
        if (activeReports.length >= 5) {
            return sendReply(from, "❌ Anda masih memiliki lebih dari 5 laporan yang sedang diproses. Silakan tunggu laporan Anda selesai diproses sebelum membuat laporan baru.");
        }

        await userRepo.updateSession(from, {
            currentAction: "create_report",
            step: "ASK_MESSAGE",
            data: {},
        });

        return sendReply(from, mainMenuResponse.mulaiLaporan(sapaan, nama));
    }

    // ✅ Keluhan marah - Buat laporan baru
    if (session.step === "MAIN_MENU" && input === 3 || (context === "angry_complaint" && process.env.AI_CONTEXT_READER)) {
        if (!user) return promptAngrySignup();

        // Validasi: cek jumlah laporan aktif
        if (activeReports.length >= 5) {
            return sendReply(from, "❌ Anda masih memiliki lebih dari 5 laporan yang sedang diproses. Silakan tunggu laporan Anda selesai diproses sebelum membuat laporan baru.");
        }

        await userRepo.updateSession(from, {
            currentAction: "create_report",
            step: "ASK_MESSAGE",
            data: {},
        });

        return sendReply(from, mainMenuResponse.angryComplaintResponse());
    }

    // ✅ Keluhan umum - Buat laporan baru
    if (session.step === "MAIN_MENU" && input === 4 || (context === "complaint" && process.env.AI_CONTEXT_READER)) {
        if (!user) return promptMengeluhSignup();

        // Validasi: cek jumlah laporan aktif
        if (activeReports.length >= 5) {
            return sendReply(from, "❌ Anda masih memiliki lebih dari 5 laporan yang sedang diproses. Silakan tunggu laporan Anda selesai diproses sebelum membuat laporan baru.");
        }

        await userRepo.updateSession(from, {
            currentAction: "create_report",
            step: "ASK_MESSAGE",
            data: {},
        });

        return sendReply(from, mainMenuResponse.complaintResponse());
    }

    // ✅ Respon default (tidak dikenali)
    const res1 = await mainMenuResponse.menuTakDikenal(sapaan, nama);
    const res2 = await mainMenuResponse.mainMenuDefault();
    return sendReply(from, res1 + res2);
};