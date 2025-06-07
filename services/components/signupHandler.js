const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const signupResponse = require("../responseMessage/signupResponse");
const spamHandler = require("./spamHandler");

module.exports = async (from, step, input, sendReply) => {
    // Ambil atau buat session baru untuk pengguna
    const session = await userRepo.getOrCreateSession(from);
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";

    // Spam handling wrapper
    const messageHandler = async () => {
        // Langkah 1: Minta nama pengguna
        if (step === "ASK_NAME") {
            await userRepo.updateSession(from, {
                step: "ASK_SEX",
                data: { ...session.data, name: input }
            });
            return sendReply(from, signupResponse.terimaKasihNama(input));
        }

        // Langkah 2: Validasi dan minta jenis kelamin
        if (step === "ASK_SEX") {
            const gender = input.toLowerCase();
            if (gender !== "pria" && gender !== "wanita") {
                return sendReply(from, signupResponse.jenisKelaminTidakValid());
            }

            await userRepo.updateSession(from, {
                step: "CONFIRM_DATA",
                data: { ...session.data, jenis_kelamin: gender }
            });

            return sendReply(from, signupResponse.konfirmasiData(session.data.name || nama, gender));
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

                return sendReply(from, signupResponse.dataTersimpan());
            }

            // Batalkan proses jika user mengetik "batal"
            if (input.toLowerCase() === "batal") {
                await userRepo.resetSession(from);
                return sendReply(from, signupResponse.pendaftaranDibatalkan(nama));
            }

            // Penanganan input selain "kirim" atau "batal"
            return sendReply(from, signupResponse.konfirmasiKirimAtauBatal());
        }

        // Penanganan fallback jika step tidak dikenal
        return sendReply(from, signupResponse.handlerDefault());
    };

    // Check for spam and handle accordingly
    if (spamHandler.isSpam(from)) {
        return spamHandler.handleSpam(from, messageHandler, sendReply);
    } else {
        return messageHandler();
    }
};
