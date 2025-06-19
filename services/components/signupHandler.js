const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const signupResponse = require("../responseMessage/signupResponse");
const checkReportResponse = require("../responseMessage/checkReportResponse");
const { affirmativeInputs, negativeInputs, genderInputs } = require("../../utils/inputTypes");

module.exports = async (from, step, input, sendReply) => {
    const session = await userRepo.getOrCreateSession(from);
    const currentAction = session.currentAction;
    const user = await userProfileRepo.findByFrom(from);

    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" :
        jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    const lowerInput = typeof input === "string" ? input?.toLowerCase?.().trim() : "";
    const affirmative = affirmativeInputs.includes(lowerInput);
    const negative = negativeInputs.includes(lowerInput);
    const gender = genderInputs.male.includes(lowerInput)
        ? "pria"
        : genderInputs.female.includes(lowerInput)
            ? "wanita"
            : null;


    // Reset ke menu utama
    if (lowerInput === "menu" || lowerInput === "kembali") {
        await userRepo.resetSession(from);
        return sendReply(from, checkReportResponse.kembaliKeMenu(sapaan, nama));
    }

    // STEP 1: Masukkan nama
    if (step === "ASK_NAME" && currentAction === "signup") {
        if (!input || (typeof input !== "string" && typeof input !== "number") || input.toString().trim() === "") {
            return sendReply(from, signupResponse.namaTidakValid());
        }
        const trimmedInput = input.toString().trim();

        // Validasi panjang nama
        if (trimmedInput.length > 30) {
            return sendReply(from, signupResponse.namaTerlaluPanjang());
        }

        // Validasi hanya huruf dan spasi
        if (!/^[a-zA-Z\s]+$/.test(trimmedInput)) {
            return sendReply(from, signupResponse.namaTidakValid());
        }

        // Nice 2
        // Format input name: Kapitalisasi kata
        const formattedName = trimmedInput
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        await userRepo.updateSession(from, {
            step: "CONFIRM_NAME",
            data: { ...session.data, name: formattedName }
        });

        return sendReply(from, signupResponse.konfirmasiNama(formattedName));
    }

    // STEP 1.5: Konfirmasi nama
    if (step === "CONFIRM_NAME" && currentAction === "signup") {
        const lowerInput = input?.toLowerCase?.() || "";

        if (lowerInput === "kirim" || affirmative) {
            await userRepo.updateSession(from, {
                step: "ASK_SEX",
                data: session.data
            });

            return sendReply(from, signupResponse.terimaKasihNama(session.data.name));
        }

        if (lowerInput === "batal" || negative) {
            await userRepo.resetSession(from);
            return sendReply(from, signupResponse.pendaftaranDibatalkan(session.data.name || nama));
        }

        return sendReply(from, signupResponse.konfirmasiNama(session.data.name));
    }

    // STEP 2: Masukkan jenis kelamin
    if (step === "ASK_SEX" && currentAction === "signup") {
        if (!gender) {
            return sendReply(from, signupResponse.jenisKelaminTidakValid());
        }

        const updatedData = {
            ...session.data,
            jenis_kelamin: gender,
        };

        // Save jenis_kelamin as lowercase
        await userRepo.updateSession(from, {
            step: "CONFIRM_DATA",
            data: updatedData
        });

        return sendReply(from, signupResponse.konfirmasiData(updatedData.name || nama, gender));
    }

    // STEP 3: Konfirmasi dan simpan data
    if (step === "CONFIRM_DATA" && currentAction === "signup") {
        if (lowerInput === "kirim" || affirmative) {
            const { name, jenis_kelamin } = session.data;

            try {
                await userProfileRepo.create({ from, name, jenis_kelamin });

                await userRepo.updateSession(from, {
                    currentAction: "create_report",
                    step: "ASK_MESSAGE",
                    data: {}
                });

                return sendReply(from, signupResponse.dataTersimpan());
            } catch (err) {
                console.error("Error saving data:", err);
                return sendReply(from, signupResponse.errorSimpanData());
            }
        }

        if (lowerInput === "batal" || negative) {
            await userRepo.resetSession(from);
            return sendReply(from, signupResponse.pendaftaranDibatalkan(nama));
        }

        return sendReply(from, signupResponse.konfirmasiKirimAtauBatal());
    }

    // Input tidak dikenal
    return sendReply(from, signupResponse.handlerDefault());
};