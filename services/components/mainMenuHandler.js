const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");

module.exports = async (from, input) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";

    // Opsi 1: Buat laporan baru
    if (input === "1") {
        
        // Jika belum terdaftar, alihkan ke proses pendaftaran
        if (!user) {
            await userRepo.updateSession(from, {
                currentAction: "signup",
                step: "ASK_NAME",
            });
            return `Beri tahu ${nama} bahwa data diri warga belum terdaftar, sebelum warga melanjutkan untuk membuat laporan, Minta warga untuk memasukan nama lengkap warga Sesuai Dengan KTP.`;
        }

        // Jika sudah terdaftar, mulai proses pembuatan laporan
        await userRepo.updateSession(from, {
            currentAction: "create_report",
            step: "ASK_LOCATION",
            data: {},
        });

        return `Beri tahu ${nama} memilih menu 1 untuk membuat laporan, dan data dari user: ${nama} sudah ada di database. jadi bisa langsung share lokasi kejadian laporannya dengan cara menggunakan fitur share location di whatsapp.`;
    }

    // Opsi 2: Cek status laporan berdasarkan sessionId
    if (input === "2") {
        
        await userRepo.updateSession(from, {
            currentAction: "check_report",
            step: "ASK_REPORT_ID",
        });
        return `Beri tahu ${nama} memilih menu 2. selanjutnya minta user untuk memasukkan ID laporan. contoh formatnya langsung saja angkanya, gausah pake LPRAA-`;
    }

    // Tanggapan default jika input tidak dikenali
    return `Beri tahu ${nama} memilih menu yang tidak dikenali. Silakan pilih menu yang tersedia. atau ketik 'menu' untuk melihat menu.`;
};