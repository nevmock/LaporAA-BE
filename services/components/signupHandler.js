const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const signupResponse = require("../responseMessage/signupResponse");

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
        return signupResponse.terimaKasihNama(input);
    }

    // Langkah 2: Validasi dan minta jenis kelamin
    if (step === "ASK_SEX") {
        const gender = input.toLowerCase();
        if (gender !== "pria" && gender !== "wanita") {
            return signupResponse.jenisKelaminTidakValid();
        }

        await userRepo.updateSession(from, {
            step: "CONFIRM_DATA",
            data: { ...session.data, jenis_kelamin: gender }
        });

        return signupResponse.konfirmasiData(session.data.name || nama, gender);
    }

    // Langkah 3: Konfirmasi dan simpan data ke database
    if (step === "CONFIRM_DATA") {
        if (input.toLowerCase() === "kirim") {
            const { name, jenis_kelamin } = session.data;

            // Simpan ke koleksi user profile
            await userProfileRepo.create({
                from,
                name,
                jenis_kelamin
            });

            // Update session untuk lanjut ke pembuatan laporan
            await userRepo.updateSession(from, {
                currentAction: "create_report",
                step: "ASK_MESSAGE",
                data: {}
            });

            return signupResponse.dataTersimpan();
        }

        // Batalkan proses jika user mengetik "batal"
        if (input.toLowerCase() === "batal") {
            await userRepo.resetSession(from);
            return signupResponse.pendaftaranDibatalkan(nama);
        }

        // Penanganan input selain "kirim" atau "batal"
        return signupResponse.konfirmasiKirimAtauBatal();
    }

    // Penanganan fallback jika step tidak dikenal
    return signupResponse.handlerDefault();
};
