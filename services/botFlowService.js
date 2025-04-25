const mainMenuHandler = require("./components/mainMenuHandler");
const signupHandler = require("./components/signupHandler");
const createReportHandler = require("./components/createReportHandler");
const checkReportHandler = require("./components/checkReportHandler");
const userRepo = require("../repositories/userRepo");
const Tindakan = require("../models/Tindakan");
const reportRepo = require("../repositories/reportRepo");

exports.handleUserMessage = async ({ from, message }) => {
    let session = await userRepo.getOrCreateSession(from);
    if (session.mode === "manual") return null;

    const input = typeof message === "string" ? message.trim().toLowerCase() : message;

    // Check for reset keywords to return user to main menu
    if (input === "menu" || input === "reset") {
        await userRepo.resetSession(from);
        return `Beri tahu user kalau Sesi nya telah direset. Silakan pilih:\n1. Buat laporan baru\n2. Cek status laporan`;
    }

    const step = session.step;

    // Handle rating input for feedback after a report is marked as complete
    if (step === "WAITING_FOR_RATING") {
        const rating = parseInt(input);
        const tindakanId = session.pendingFeedbackFor?.[0];

        if (isNaN(rating) || rating < 1 || rating > 5) {
            return `Beri tahu user untuk memberikan rating antara 1 hingga 5.`;
        }

        try {
            const tindakan = await Tindakan.findById(tindakanId).populate("report");
            const report = tindakan?.report;

            if (!tindakan || !report) {
                return "Beri tahu user kalau Laporan tidak ditemukan. Mohon coba lagi.";
            }

            report.rating = rating;
            await report.save();

            // Remove feedback from queue and reset session step to main menu
            session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
            session.step = "MAIN_MENU";
            session.currentAction = null;
            await session.save();

            return `Beri tahu user, ucapkan Terima kasih atas rating ${rating} untuk laporan ${report.sessionId}. beri tahu user kalau Kami akan terus meningkatkan layanan.`;
        } catch (err) {
            console.error("Gagal menyimpan rating:", err);
            return "Beri tahu user kalau Terjadi kesalahan saat menyimpan rating. Silakan coba lagi.";
        }
    }

    // Wait for user confirmation whether a report is resolved or needs follow-up
    if (session.pendingFeedbackFor && session.pendingFeedbackFor.length > 0) {
        const tindakanId = session.pendingFeedbackFor[0];
        const tindakan = await Tindakan.findById(tindakanId).populate("report");

        if (["ya", "belum"].includes(input)) {
            if (tindakan?.status === "Selesai Penanganan" && tindakan.feedbackStatus === "Sudah Ditanya") {
                let reply;

                if (input === "ya") {
                    // User confirms issue is resolved
                    tindakan.feedbackStatus = "Sudah Jawab Beres";
                    tindakan.status = "Selesai Pengaduan";
                    await tindakan.save();

                    session.step = "WAITING_FOR_RATING";
                    await session.save();

                    reply = `sampaikan Terima kasih atas tanggapan user.\nLaporan dengan ID ${tindakan.report.sessionId} ditutup.\n\n` +
                        `beri tahu user Sebagai bentuk peningkatan layanan, bolehkah user memberi penilaian (1–5)?`;
                } else {
                    // User requests further follow-up
                    tindakan.feedbackStatus = "Sudah Jawab Belum Beres";
                    tindakan.status = "Proses OPD Terkait";
                    await tindakan.save();

                    session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
                    session.step = "MAIN_MENU";
                    await session.save();

                    reply = `beri tahu user bahwa Laporan ${tindakan.report.sessionId} akan ditindaklanjuti ulang. dan ucapkan Terima kasih kepada user atas responnya.`;

                    if (session.pendingFeedbackFor.length > 0) {
                        reply += `sampaikkan pada user kalau Masih ada ${session.pendingFeedbackFor.length} laporan lain yang menunggu respon.\nSilakan balas ya atau belum.`;
                    }
                }

                return reply;
            }
        }

        // If user skips confirmation and sends unrelated input
        return `sampaikan user kalau  masih memiliki laporan yang menunggu konfirmasi penyelesaian.` +
            `sampaikan ke pada user Silakan balas ya jika puas, atau belum jika masih perlu ditindaklanjuti.`;
    }

    // Handle main menu navigation and all structured actions
    if (!session.currentAction && step === "MAIN_MENU") return await mainMenuHandler(from, input);
    if (session.currentAction === "signup") return await signupHandler(from, step, input);
    if (session.currentAction === "create_report") return await createReportHandler(from, step, input);
    if (session.currentAction === "check_report") return await checkReportHandler(from, step, input);

    // Reset session if no matching condition was found
    await userRepo.resetSession(from);
    return `ini adalah default jika command tidak dikenali, ucapkan salam juga ya dan Beri tahu user untuk memilih:\n1. Buat laporan baru\n2. Cek status laporan input nya harus 1 atau 2, jelaskan juga ke usernya dengan singkat`;
};
