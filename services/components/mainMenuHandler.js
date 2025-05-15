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
            return `Beritahu ${nama} bahwa data diri warga belum terdaftar, sebelum warga melanjutkan untuk membuat laporan, Minta warga untuk memasukan nama lengkap warga Sesuai Dengan KTP.`;
        }

        // Jika sudah terdaftar, mulai proses pembuatan laporan
        await userRepo.updateSession(from, {
            currentAction: "create_report",
            step: "ASK_LOCATION",
            data: {},
        });

        return `Minta ${nama} untuk share lokasi kejadian laporannya hanya dengan cara menggunakan fitur share location di whatsapp.`;
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
    return `Beritahu ${nama} memilih menu yang tidak dikenali. Silakan pilih menu yang tersedia. atau ketik 'menu' untuk melihat menu.`;
};