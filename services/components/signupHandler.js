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
        return `Terima kasih saudara/i ${nama}, silahkan masukkan jenis kelamin anda (Laki-laki / perempuan).`;
    }

    // Langkah 1.2: Validasi dan minta jenis kelamin
    if (step === "ASK_SEX") {

        await userRepo.updateSession(from, {
            step: "ASK_AGE",
            data: { ...session.data, jenis_kelamin: input }
        });
        return `Terima kasih saudara/i ${nama}, silahkan masukkan umur anda.`;
    }

    // Langkah 1.2: Validasi dan minta umur
    if (step === "ASK_AGE") {
        const umur = parseInt(input);

        // Validasi: harus angka dan positif
        if (isNaN(umur) || umur <= 0) {
            return `mohon maaf ${nama} input umur anda tidak valid. Harap masukkan umur dalam angka, contoh: 25`;
        }

        if (umur < 17) {
            await userRepo.updateSession(from, {
                step: "ASK_ADDRESS",
                data: { ...session.data, umur, nik: "BELUM PUNYA" }
            });

            return `Terima kasih saudara ${nama}, berikutnya silahkan masukkan alamat domisili anda saat ini sebelum memulai membuat laporan. Contoh : Jalan Bekasi No.5`;
        }

        await userRepo.updateSession(from, {
            step: "ASK_NIK",
            data: { ...session.data, umur }
        });

        return `Terima kasih <pak/bu> ${nama}, untuk kebutuhan kroscek kebenaran data anda dengan sistem Pemerintah Kabupaten Bekasi, mohon masukkan Nomer Induk Kependudukan (NIK) yang terdiri dari 16 digit yang sesuai dengan KTP yang masih berlaku. `;
    }

    // Langkah 2: Validasi dan minta NIK (Nomor Induk Kependudukan)
    if (step === "ASK_NIK") {
        const isValidNik = /^\d{16}$/.test(input);
        if (!isValidNik) {
            return `Mohon Maaf ${nama}, input NIK anda tidak valid. NIK Harus terdiri dari 16 digit angka. silahkan untuk masukkan ulang Nomor KTP anda:`;
        }

        await userRepo.updateSession(from, {
            step: "ASK_ADDRESS",
            data: { ...session.data, nik: input }
        });
        return `Terima kasih <pak/bu> ${nama}, berikutnya silahkan masukkan alamat domisili anda saat ini sesuai KTP sebelum memulai membuat laporan. Contoh : Jalan Bekasi No.5`;
    }

    // Langkah 3: Simpan alamat domisili dan lanjut ke konfirmasi
    if (step === "ASK_ADDRESS") {
        await userRepo.updateSession(from, {
            step: "ASK_IS_LOCAL",
            data: { ...session.data, address: input }
        });

        return `Terima kasih ${nama}. Apakah ${nama} adalah warga Kabupaten Bekasi? (ya/tidak)`;
    }

    // Langkah 3.2
    if (step === "ASK_IS_LOCAL") {
        const isYes = input.toLowerCase() === "ya";
        const isNo = input.toLowerCase() === "tidak";

        if (isYes) {
            await userRepo.updateSession(from, {
                step: "CONFIRM_DATA",
                data: session.data
            });

            const { name, umur, nik, address, jenis_kelamin } = session.data;

            return `Terimakasih ${nama} atas data dirinya. Apakah benar data diri anda sebagai berikut:
Nama: ${name}
NIK: ${nik}
Umur: ${umur}
Jenis Kelamin: ${jenis_kelamin}
Alamat Domisili: ${address}

Jika sudah benar silakan ketik *kirim* untuk menyimpan data anda, atau *batal* untuk membatalkan.
Data ini digunakan untuk proses pelaporan dan dijaga kerahasiaannya.`;
        }

        if (isNo) {
            await userRepo.resetSession(from);
            const sapaan = session.data.jenis_kelamin?.toLowerCase() === "laki-laki" ? "Pak" : "Bu";

            return `Terima kasih ${sapaan} ${nama} sudah tertarik menggunakan layanan Lapor AA Kabupaten Bekasi.

Mohon maaf sebelumnya, *Lapor AA hanya melayani keluhan untuk masyarakat Kabupaten Bekasi*.

Semoga layanan seperti Lapor AA bisa juga hadir di area ${sapaan} ${nama} ya. Terima kasih banyak atas partisipasinya.`;
        }

        return `Beri tahu ${nama} untuk menjawab *ya* jika warga Kabupaten Bekasi, atau *tidak* jika bukan.`;
    }

    // Langkah 4: Konfirmasi dan simpan data ke database
    if (step === "CONFIRM_DATA") {
        if (input.toLowerCase() === "kirim") {
            const { name, umur, nik, address, jenis_kelamin } = session.data;

            // Simpan ke koleksi user profile
            await userProfileRepo.create({
                from,
                name,
                umur,
                nik,
                address,
                jenis_kelamin
            });

            // Update session untuk lanjut ke pembuatan laporan
            await userRepo.updateSession(from, {
                currentAction: "create_report",
                step: "ASK_MESSAGE",
                data: {}
            });

            return `Silahkan ceritakan keluhan atau kejadian yang ingin anda laporkan`;
        }

        // Batalkan proses jika user mengetik "batal"
        if (input.toLowerCase() === "batal") {
            await userRepo.resetSession(from);
            return `Terima kasih ${nama}, pendaftaran dibatalkan.`;
        }

        // Penanganan input selain "kirim" atau "batal"
        return `Mohon maaf ${nama} ketik *kirim* untuk menyimpan data, atau *batal* untuk membatalkan.`;
    }

    // Penanganan fallback jika step tidak dikenal
    return `Mohon maaf ${nama} pilihan anda tidak dikenali. Silakan ketik "menu" yang tersedia untuk melihat menu utama.`;
};
