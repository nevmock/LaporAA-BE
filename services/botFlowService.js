const mainMenuHandler = require("./components/mainMenuHandler");
const signupHandler = require("./components/signupHandler");
const createReportHandler = require("./components/createReportHandler");
const checkReportHandler = require("./components/checkReportHandler");
const userRepo = require("../repositories/userRepo");
const tindakanRepo = require("../repositories/tindakanRepo");
const userProfileRepo = require("../repositories/userProfileRepo");
const { startContext } = require("../utils/openAiHelper");
// const { startContext } = require("../utils/geminiHelper");

exports.handleUserMessage = async ({ from, message }) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const GeminiStartContext = await startContext(message);

    let session = await userRepo.getOrCreateSession(from);
    if (session.mode === "manual") return null;

    const input = typeof message === "string" ? message.trim().toLowerCase() : message;
    const step = session.step;

    if (step === "MAIN_MENU" && GeminiStartContext === "true" ) {
        return `Halo ${nama} selamat datang di Lapor AA Pemerintahan Kabupaten Bekasi. 

Apabila situasi anda darurat, bisa menghubungi nomer berikut :
- 119 : PSC  (Untuk Kegawat Daruratan Medis)
- 113 : Pemadam Kebakaran
- 110 : Kepolisian (Kriminal dll)
- 081219071900 : BPBD (Untuk Bantuan Penanggulangan Bencana)

Jika tidak dalam keadaan darurat, apakah ingin membuat laporan, atau cek status laporan?`;
    }

    // Reset session jika user ketik 'menu' atau 'reset'
    if (input === "menu" || input === "reset") {
        await userRepo.resetSession(from);
        return `Halo ${nama} selamat datang di Lapor AA Pemerintahan Kabupaten Bekasi. apakah ingin membuat laporan, atau cek status laporan?`;
    }

    // Handle Rating setelah laporan selesai
    if (step === "WAITING_FOR_RATING") {
        const rating = parseInt(input);
        const tindakanId = session.pendingFeedbackFor?.[0];

        if (isNaN(rating) || rating < 1 || rating > 5) {
            return `Mohon Maaf ${nama} rating tidak valid. Silakan berikan rating antara 1 hingga 5.`;
        }

        try {
            const tindakan = await tindakanRepo.findById(tindakanId);
            if (!tindakan) {
                return `Mohon Maaf ${nama}, laporan tidak di temukan.`;
            }

            tindakan.rating = rating;
            await tindakan.save();

            session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
            session.step = "MAIN_MENU";
            session.currentAction = null;
            await session.save();

            return `Terima kasih atas rating ${rating} untuk laporan Anda ${nama}! Kami akan terus meningkatkan layanan.`;
        } catch (err) {
            console.error("Gagal menyimpan rating:", err);
            return `Terjadi kesalahan saat menyimpan rating. Silakan berikan rating antara 1 hingga 5.`;
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

            return `Mohon Maaf ${nama}, laporan dengan ID ${tindakan.report.sessionId} *tidak dapat ditindaklanjuti* dan telah *ditolak* oleh petugas.
            Alasan penolakan: ${tindakan.kesimpulan || "Tidak tersedia"}
            Silahkan untuk membuat laporan ulang dengan memperbaiki kesalahannya
            Terimakasih.`;
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

                    reply = `Terima kasih ${nama}, atas tanggapannya.
                    Laporan ${tindakan.report.sessionId} akan ditutup.
                    Sebagai bentuk peningkatan layanan, mohon berikan rating 1-5. cukup input angka 1-5 saja`;
                } else {
                    tindakan.feedbackStatus = "Sudah Jawab Belum Beres";
                    tindakan.status = "Proses OPD Terkait";
                    await tindakan.save();

                    session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
                    session.step = "MAIN_MENU";
                    await session.save();

                    reply = `Terima kasih ${nama}, Laporan ${tindakan.report.sessionId} akan segera kita tindak lanjuti ulang. 
                    Mohon maaf atas ketidak puasan penyelesaian laporannya. Terimakasih sudah menanggapi laporannya`;

                    if (session.pendingFeedbackFor.length > 0) {
                        reply += `Masih ada ${session.pendingFeedbackFor.length} laporan lain yang menunggu respon. Balas "puas" atau "belum". untuk melakukan penyelesaian laporan ${tindakan.report.sessionId}.`;
                    }
                }
                return reply;
            }
        }
        return `Mohon maaf ${nama}, anda masih memiliki laporan yang menunggu konfirmasi penyelesaian. Balas "puas" jika sudah selesai, atau "belum" jika masih ada masalah.`;
    }

    // Handle Main Menu dan Langkah-langkah Bot
    if (!session.currentAction && step === "MAIN_MENU") return await mainMenuHandler(from, input);
    if (session.currentAction === "signup") return await signupHandler(from, step, input);
    if (session.currentAction === "create_report") return await createReportHandler(from, step, input);
    if (session.currentAction === "check_report") return await checkReportHandler(from, step, input);

    // Default Reset kalau semua gak cocok
    await userRepo.resetSession(from);
};