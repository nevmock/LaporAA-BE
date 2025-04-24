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
            return `Sebelum membuat laporan, kami butuh data Anda.\nNama lengkap sesuai KTP:`;
        }

        // Jika sudah terdaftar, mulai proses pembuatan laporan
        await userRepo.updateSession(from, {
            currentAction: "create_report",
            step: "ASK_LOCATION",
            data: {},
        });

        return `Silakan bagikan lokasi Anda melalui fitur share location WhatsApp.`;
    }

    // Opsi 2: Cek status laporan berdasarkan sessionId
    if (input === "2") {
        await userRepo.updateSession(from, {
            currentAction: "check_report",
            step: "ASK_REPORT_ID",
        });
        return `Silakan masukkan nomor laporan Anda (contoh: LPRAA-387512):`;
    }

    // Tanggapan default jika input tidak dikenali
    return `Silakan pilih:\n1. Buat laporan baru\n2. Cek status laporan`;
};