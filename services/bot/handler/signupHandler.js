const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const response = require("../../utils/response");
const responseError = require("../../utils/responseError");

/**
 * Menangani proses pendaftaran warga saat belum memiliki data profil.
 * Langkah-langkah terdiri dari: minta nama → jenis kelamin → NIK → alamat → konfirmasi.
 * 
 * @param {string} from - Nomor WhatsApp pengguna
 * @param {string} step - Langkah saat ini dalam alur signup
 * @param {string} input - Pesan pengguna
 * @returns {Promise<string>} - Respon yang akan dikirimkan ke pengguna
 */
module.exports = async (from, step, input) => {
    try {
        const session = await userRepo.getOrCreateSession(from);
        const nama = session.data?.name || "Warga";

        // Langkah 1: Minta nama lengkap
        if (step === "ASK_NAME") {
            await userRepo.updateSession(from, {
                step: "ASK_SEX",
                data: { ...session.data, name: input }
            });
            return response.signup.askSex(input); // Gunakan input sebagai nama warga
        }

        // Langkah 2: Minta jenis kelamin
        if (step === "ASK_SEX") {
            await userRepo.updateSession(from, {
                step: "ASK_NIK",
                data: { ...session.data, jenis_kelamin: input }
            });
            return response.signup.askNik(nama);
        }

        // Langkah 3: Validasi dan minta NIK
        if (step === "ASK_NIK") {
            const isValidNik = /^\d{16}$/.test(input);
            if (!isValidNik) return response.signup.invalidNik(nama);

            await userRepo.updateSession(from, {
                step: "ASK_ADDRESS",
                data: { ...session.data, nik: input }
            });
            return response.signup.askAddress(nama);
        }

        // Langkah 4: Minta alamat dan lanjut ke konfirmasi
        if (step === "ASK_ADDRESS") {
            const updatedData = { ...session.data, address: input };
            await userRepo.updateSession(from, {
                step: "CONFIRM_DATA",
                data: updatedData
            });
            return response.signup.confirmData(nama, updatedData);
        }

        // Langkah 5: Konfirmasi data dan simpan ke database
        if (step === "CONFIRM_DATA") {
            const confirmation = input.toLowerCase();
            const data = session.data;

            if (confirmation === "kirim") {
                await userProfileRepo.create({
                    from,
                    name: data.name,
                    nik: data.nik,
                    address: data.address,
                    jenis_kelamin: data.jenis_kelamin,
                });

                await userRepo.updateSession(from, {
                    currentAction: "create_report",
                    step: "ASK_LOCATION",
                    data: {}
                });

                return response.signup.saveSuccess(data.name);
            }

            if (confirmation === "batal") {
                await userRepo.resetSession(from);
                return response.signup.cancelled(nama);
            }

            return response.signup.confirmInstruction(nama);
        }

        // Fallback jika step tidak dikenali
        return response.checkReport.unknownStep(nama);

    } catch (err) {
        console.error("Error di signupHandler:", err);

        try {
            const session = await userRepo.getOrCreateSession(from);
            const fallbackName = session.data?.name || "Warga";
            return responseError.defaultErrorMessage(fallbackName);
        } catch {
            return "Terjadi kesalahan. Silakan coba lagi nanti.";
        }
    }
};