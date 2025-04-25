const mainMenuHandler = require("./components/mainMenuHandler");
const signupHandler = require("./components/signupHandler");
const createReportHandler = require("./components/createReportHandler");
const checkReportHandler = require("./components/checkReportHandler");
const userRepo = require("../repositories/userRepo");
const tindakanRepo = require("../repositories/tindakanRepo");

exports.handleUserMessage = async ({ from, message }) => {
    let session = await userRepo.getOrCreateSession(from);
    if (session.mode === "manual") return null;

    const input = typeof message === "string" ? message.trim().toLowerCase() : message;
    const step = session.step;

    // Reset session jika user ketik 'menu' atau 'reset'
    if (input === "menu" || input === "reset") {
        await userRepo.resetSession(from);
        return `Sesi telah direset. Silakan pilih:\n1. Buat laporan baru\n2. Cek status laporan`;
    }

    // Handle Rating setelah laporan selesai
    if (step === "WAITING_FOR_RATING") {
        const rating = parseInt(input);
        const tindakanId = session.pendingFeedbackFor?.[0];

        if (isNaN(rating) || rating < 1 || rating > 5) {
            return `Silakan berikan rating antara 1 hingga 5.`;
        }

        try {
            const tindakan = await tindakanRepo.findById(tindakanId);
            if (!tindakan) {
                return `Laporan tidak ditemukan. Mohon coba lagi.`;
            }

            tindakan.rating = rating;
            await tindakan.save();

            session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
            session.step = "MAIN_MENU";
            session.currentAction = null;
            await session.save();

            return `Terima kasih atas rating ${rating} untuk laporan Anda! Kami akan terus meningkatkan layanan.`;
        } catch (err) {
            console.error("Gagal menyimpan rating:", err);
            return `Terjadi kesalahan saat menyimpan rating. Silakan coba lagi.`;
        }
    }

    // Handle Konfirmasi Penyelesaian Laporan
    if (session.pendingFeedbackFor && session.pendingFeedbackFor.length > 0) {
        const tindakanId = session.pendingFeedbackFor[0];
        const tindakan = await tindakanRepo.findById(tindakanId);

        if (["ya", "belum"].includes(input)) {
            if (tindakan?.status === "Selesai Penanganan" && tindakan.feedbackStatus === "Sudah Ditanya") {
                let reply;

                if (input === "ya") {
                    tindakan.feedbackStatus = "Sudah Jawab Beres";
                    tindakan.status = "Selesai Pengaduan";
                    await tindakan.save();

                    session.step = "WAITING_FOR_RATING";
                    await session.save();

                    reply = `Terima kasih atas konfirmasi Anda!\nLaporan ${tindakan.report.sessionId} ditutup.\n\nSebagai bentuk peningkatan layanan, mohon berikan rating 1-5.`;
                } else {
                    tindakan.feedbackStatus = "Sudah Jawab Belum Beres";
                    tindakan.status = "Proses OPD Terkait";
                    await tindakan.save();

                    session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
                    session.step = "MAIN_MENU";
                    await session.save();

                    reply = `Laporan ${tindakan.report.sessionId} akan segera ditindaklanjuti ulang. Terima kasih atas respon Anda!`;

                    if (session.pendingFeedbackFor.length > 0) {
                        reply += `\nMasih ada ${session.pendingFeedbackFor.length} laporan lain yang menunggu respon. Balas "ya" atau "belum".`;
                    }
                }

                return reply;
            }
        }

        return `Anda masih memiliki laporan yang menunggu konfirmasi penyelesaian. Balas "ya" jika sudah selesai, atau "belum" jika masih ada masalah.`;
    }

    // Handle Main Menu dan Langkah-langkah Bot
    if (!session.currentAction && step === "MAIN_MENU") return await mainMenuHandler(from, input);
    if (session.currentAction === "signup") return await signupHandler(from, step, input);
    if (session.currentAction === "create_report") return await createReportHandler(from, step, input);
    if (session.currentAction === "check_report") return await checkReportHandler(from, step, input);

    // Default Reset kalau semua gak cocok
    await userRepo.resetSession(from);
    return `Halo! 👋 Silakan pilih:\n1. Buat laporan baru\n2. Cek status laporan\n(Balas angka 1 atau 2)`;
};