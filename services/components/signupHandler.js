const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");

module.exports = async (from, step, input) => {
    // Ambil atau buat session baru untuk pengguna
    const session = await userRepo.getOrCreateSession(from);

    // Langkah 1: Minta nama pengguna
    if (step === "ASK_NAME") {
        await userRepo.updateSession(from, {
            step: "ASK_NIK",
            data: { ...session.data, name: input }
        });
        return `Masukkan Nomor KTP (16 digit):`;
    }

    // Langkah 2: Validasi dan minta NIK (Nomor Induk Kependudukan)
    if (step === "ASK_NIK") {
        const isValidNik = /^\d{16}$/.test(input);
        if (!isValidNik) {
            return `NIK tidak valid. Harus terdiri dari 16 digit angka.\nSilakan masukkan ulang Nomor KTP:`;
        }

        await userRepo.updateSession(from, {
            step: "ASK_ADDRESS",
            data: { ...session.data, nik: input }
        });
        return `Masukkan alamat domisili (sesuai KTP):`;
    }

    // Langkah 3: Simpan alamat domisili dan lanjut ke konfirmasi
    if (step === "ASK_ADDRESS") {
        await userRepo.updateSession(from, {
            step: "CONFIRM_DATA",
            data: { ...session.data, address: input }
        });

        const { name, nik, address } = session.data;

        return `Mohon konfirmasi data berikut:\n\n` +
            `Nama: ${name}\n` +
            `NIK: ${nik}\n` +
            `Alamat: ${input}\n\n` +
            `Ketik *kirim* untuk menyimpan, atau *batal* untuk membatalkan.`;
    }

    // Langkah 4: Konfirmasi dan simpan data ke database
    if (step === "CONFIRM_DATA") {
        if (input.toLowerCase() === "kirim") {
            const { name, nik, address } = session.data;

            // Simpan ke koleksi user profile
            await userProfileRepo.create({
                from,
                name,
                nik,
                address
            });

            // Update session untuk lanjut ke pembuatan laporan
            await userRepo.updateSession(from, {
                currentAction: "create_report",
                step: "ASK_LOCATION",
                data: {}
            });

            return `Data berhasil disimpan. Terima kasih, ${name}.\n\nSilakan masukkan lokasi kejadiannya:`;
        }

        // Batalkan proses jika user mengetik "batal"
        if (input.toLowerCase() === "batal") {
            await userRepo.resetSession(from);
            return `Pendaftaran dibatalkan. Balas apa saja untuk kembali ke menu utama.`;
        }

        // Penanganan input selain "kirim" atau "batal"
        return `Ketik *kirim* untuk menyimpan data, atau *batal* untuk membatalkan.`;
    }

    // Penanganan fallback jika step tidak dikenal
    return `Terjadi kesalahan saat proses pendaftaran. Balas apa saja untuk kembali ke menu utama.`;
};
