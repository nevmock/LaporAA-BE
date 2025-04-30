const mainMenuHandler = require("./components/mainMenuHandler");
const signupHandler = require("./components/signupHandler");
const createReportHandler = require("./components/createReportHandler");
const checkReportHandler = require("./components/checkReportHandler");
const userRepo = require("../repositories/userRepo");
const tindakanRepo = require("../repositories/tindakanRepo");
const userProfileRepo = require("../repositories/userProfileRepo");

exports.handleUserMessage = async ({ from, message }) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";

    let session = await userRepo.getOrCreateSession(from);
    if (session.mode === "manual") return null;

    const input = typeof message === "string" ? message.trim().toLowerCase() : message;
    const step = session.step;

    // Reset session jika user ketik 'menu' atau 'reset'
    if (input === "menu" || input === "reset") {
        await userRepo.resetSession(from);
        return `warga ${nama} memilih menu awal. pilih 1 untuk membuat laporan dan 2 untuk cek status laporan.`;
    }

    // Handle Rating setelah laporan selesai
    if (step === "WAITING_FOR_RATING") {
        const rating = parseInt(input);
        const tindakanId = session.pendingFeedbackFor?.[0];

        if (isNaN(rating) || rating < 1 || rating > 5) {
            return `beri tahu warga ${nama} kalau rating tidak valid. Silakan berikan rating antara 1 hingga 5.`;
        }

        try {
            const tindakan = await tindakanRepo.findById(tindakanId);
            if (!tindakan) {
                return `beri tahu warga ${nama} kalau Laporan tidak ditemukan.`;
            }

            tindakan.rating = rating;
            await tindakan.save();

            session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
            session.step = "MAIN_MENU";
            session.currentAction = null;
            await session.save();

            return `beri tahu warga ${nama} Terima kasih atas rating ${rating} untuk laporan Anda! Kami akan terus meningkatkan layanan.`;
        } catch (err) {
            console.error("Gagal menyimpan rating:", err);
            return `beri tahu warga ${nama} Terjadi kesalahan saat menyimpan rating. Silakan coba lagi.`;
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
    
            return `beri tahu warga ${nama} Mohon maaf, laporan dengan ID ${tindakan.report.sessionId} *tidak dapat ditindaklanjuti* dan telah *ditolak* oleh petugas.\n\nAlasan penolakan: ${tindakan.kesimpulan || "Tidak tersedia"}\n\nTerima kasih atas partisipasi Anda.`;
        }
    
        // Kasus laporan selesai normal (dengan rating)
        if (["ya", "belum"].includes(input)) {
            if (tindakan?.status === "Selesai Penanganan" && tindakan.feedbackStatus === "Sudah Ditanya") {
                let reply;
    
                if (input === "ya") {
                    tindakan.feedbackStatus = "Sudah Jawab Beres";
                    tindakan.status = "Selesai Pengaduan";
                    await tindakan.save();
    
                    session.step = "WAITING_FOR_RATING";
                    await session.save();
    
                    reply = `beri tahu warga ${nama} Terima kasih atas konfirmasi Anda!\nLaporan ${tindakan.report.sessionId} ditutup.\n\nSebagai bentuk peningkatan layanan, mohon berikan rating 1-5.`;
                } else {
                    tindakan.feedbackStatus = "Sudah Jawab Belum Beres";
                    tindakan.status = "Proses OPD Terkait";
                    await tindakan.save();
    
                    session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
                    session.step = "MAIN_MENU";
                    await session.save();
    
                    reply = `beri tahu warga ${nama} Laporan ${tindakan.report.sessionId} akan segera ditindaklanjuti ulang. Terima kasih atas respon Anda!`;
    
                    if (session.pendingFeedbackFor.length > 0) {
                        reply += `\nMasih ada ${session.pendingFeedbackFor.length} laporan lain yang menunggu respon. Balas "ya" atau "belum".`;
                    }
                }
    
                return reply;
            }
        }
    
        return `beri tahu warga ${nama} Anda masih memiliki laporan yang menunggu konfirmasi penyelesaian. Balas "ya" jika sudah selesai, atau "belum" jika masih ada masalah.`;
    }    

    // Handle Main Menu dan Langkah-langkah Bot
    if (!session.currentAction && step === "MAIN_MENU") return await mainMenuHandler(from, input);
    if (session.currentAction === "signup") return await signupHandler(from, step, input);
    if (session.currentAction === "create_report") return await createReportHandler(from, step, input);
    if (session.currentAction === "check_report") return await checkReportHandler(from, step, input);

    // Default Reset kalau semua gak cocok
    await userRepo.resetSession(from);
    return `Warga dengan nama ${nama} memilih menu yang tidak dikenali. Silakan pilih menu yang tersedia. atau ketik 'menu' untuk melihat menu.`;
};