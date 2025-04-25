const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");

module.exports = async (from, input) => {
    // Opsi 1: Buat laporan baru
    if (input === "1") {
        // Cek apakah pengguna sudah terdaftar
        const user = await userProfileRepo.findByFrom(from);
        
        // Jika belum terdaftar, alihkan ke proses pendaftaran
        if (!user) {
            await userRepo.updateSession(from, {
                currentAction: "signup",
                step: "ASK_NAME",
            });
            return `Beri tahu user kalau Sebelum membuat laporan, kami butuh data Anda. \nNama lengkap sesuai KTP:`;
        }

        // Jika sudah terdaftar, mulai proses pembuatan laporan
        await userRepo.updateSession(from, {
            currentAction: "create_report",
            step: "ASK_LOCATION",
            data: {},
        });

        return `Beri tahu user untuk bagikan lokasi Anda melalui fitur share location WhatsApp.`;
    }

    // Opsi 2: Cek status laporan berdasarkan sessionId
    if (input === "2") {
        await userRepo.updateSession(from, {
            currentAction: "check_report",
            step: "ASK_REPORT_ID",
        });
        return `Beri tahu user untuk memasukkan nomor laporannya (contohnya 387512) jadi nomornya aja`;
    }

    // Tanggapan default jika input tidak dikenali
    return `ini adalah default jika command tidak dikenali, ucapkan salam juga ya dan Beri tahu user untuk memilih:\n1. Buat laporan baru\n2. Cek status laporan input nya harus 1 atau 2, jelaskan juga ke usernya dengan singkat`;
};