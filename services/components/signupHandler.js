const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");

module.exports = async (from, step, input) => {
    // Ambil atau buat session baru untuk pengguna
    const session = await userRepo.getOrCreateSession(from);
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";

    // Langkah 1: Minta nama pengguna
    if (step === "ASK_NAME") {
        await userRepo.updateSession(from, {
            step: "ASK_SEX",
            data: { ...session.data, name: input }
        });
        return `Beri tahu ${nama} untuk sebutkan Jenis Kelaminnya (Laki-laki/Perempuan).`;
    }

    // Langkah 1.2: Validasi dan minta NIK (Nomor Induk Kependudukan)
    if (step === "ASK_SEX") {

        await userRepo.updateSession(from, {
            step: "ASK_NIK",
            data: { ...session.data, jenis_kelamin: input }
        });
        return `Beri tahu ${nama} memasukan Nomor Induk Kependudukannya NIK sesuai dengan KTP yang masih berlaku.`;
    }

    // Langkah 2: Validasi dan minta NIK (Nomor Induk Kependudukan)
    if (step === "ASK_NIK") {
        const isValidNik = /^\d{16}$/.test(input);
        if (!isValidNik) {
            return `Beri tahu ${nama} NIK tidak valid. Harus terdiri dari 16 digit angka. dan persilahkan user untuk masukkan ulang Nomor KTP:`;
        }

        await userRepo.updateSession(from, {
            step: "ASK_ADDRESS",
            data: { ...session.data, nik: input }
        });
        return `Beri tahu ${nama} untuk Masukkan alamat domisili sesuai KTP.`;
    }

    // Langkah 3: Simpan alamat domisili dan lanjut ke konfirmasi
    if (step === "ASK_ADDRESS") {
        await userRepo.updateSession(from, {
            step: "CONFIRM_DATA",
            data: { ...session.data, address: input }
        });

        const { name, nik, address, jenis_kelamin } = session.data;

        return `Beri tahu ${nama} untuk verifikasi data berikut` +
            `Ketik *kirim* untuk menyimpan, atau *batal* untuk membatalkan.`;
    }

    // Langkah 4: Konfirmasi dan simpan data ke database
    if (step === "CONFIRM_DATA") {
        if (input.toLowerCase() === "kirim") {
            const { name, nik, address, jenis_kelamin } = session.data;

            // Simpan ke koleksi user profile
            await userProfileRepo.create({
                from,
                name,
                nik,
                address,
                jenis_kelamin
            });

            // Update session untuk lanjut ke pembuatan laporan
            await userRepo.updateSession(from, {
                currentAction: "create_report",
                step: "ASK_LOCATION",
                data: {}
            });

            return `Beri tahu ${nama} bahwa data telah disimpan. Dan bisa langsung Share Lokasi Kejadian Pengaduannya menggunakan fitur share location di WhatsApp.`;
        }

        // Batalkan proses jika user mengetik "batal"
        if (input.toLowerCase() === "batal") {
            await userRepo.resetSession(from);
            return `Beri tahu ${nama} bahwa pendaftaran dibatalkan. Balas pesan untuk kembali ke menu utama.`;
        }

        // Penanganan input selain "kirim" atau "batal"
        return `Beri tahu ${nama} untuk mengetik *kirim* untuk menyimpan, atau *batal* untuk membatalkan.`;
    }

    // Penanganan fallback jika step tidak dikenal
    return `Beri tahu ${nama} memilih menu yang tidak dikenali. Silakan ketik "menu" yang tersedia untuk melihat menu utama.`;
};
