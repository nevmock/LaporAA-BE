const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const { menuContext } = require("../../utils/openAiHelper");

module.exports = async (from, input) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const GeminiMenuContext = await menuContext(input);

    // Opsi 1: Buat laporan baru
    if (input === "1" || GeminiMenuContext === "1") {
        
        // Jika belum terdaftar, alihkan ke proses pendaftaran
        if (!user) {
            await userRepo.updateSession(from, {
                currentAction: "signup",
                step: "ASK_NAME",
            });
            return `Data diri Anda belum terdaftar di sistem kami. Sebelum melanjutkan untuk membuat laporan, tolong masukkan nama lengkap Anda sesuai dengan KTP. Terima kasih atas kerjasamanya.`;
        }

        // Jika sudah terdaftar, mulai proses pembuatan laporan
        await userRepo.updateSession(from, {
            currentAction: "create_report",
            step: "ASK_MESSAGE",
            data: {},
        });

        return `Silahkan ceritakan keluhan atau kejadian yang ingin anda laporkan`;
    }

    // Opsi 2: Cek status laporan berdasarkan sessionId
    if (input === "2" || GeminiMenuContext === "2") {
        
        await userRepo.updateSession(from, {
            currentAction: "check_report",
            step: "ASK_REPORT_ID",
        });
        return `Minta ${nama} untuk memasukkan ID laporan. contohnya 12345678. `;
    }

    // Tanggapan default jika input tidak dikenali
    return `Mohon maaf ${nama} pilihan anda tidak dikenali. Silakan ketik "menu" yang tersedia untuk melihat menu utama.`;
};