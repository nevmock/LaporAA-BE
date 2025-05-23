const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const { menuContext } = require("../../utils/openAiHelper");
const response = require("../../../utils/response");
const responseError = require("../../../utils/responseError");

/**
 * Menangani input dari pengguna ketika berada di step MAIN_MENU.
 * Fungsi ini akan menentukan apakah pengguna ingin membuat laporan atau mengecek laporan.
 * 
 * @param {string} from - Nomor WhatsApp pengguna
 * @param {string} input - Pesan teks dari pengguna
 * @returns {Promise<string>} - Respon teks yang akan dikirimkan ke pengguna
 */
module.exports = async (from, input) => {
    try {
        const user = await userProfileRepo.findByFrom(from);
        const nama = user?.name || "Warga";

        // Gunakan AI untuk mengenali konteks menu jika input bukan angka langsung
        const GeminiMenuContext = await menuContext(input);

        // === Buat laporan baru (Opsi 1) ===
        if (input === "1" || GeminiMenuContext === "1") {
            if (!user) {
                await userRepo.updateSession(from, {
                    currentAction: "signup",
                    step: "ASK_NAME",
                });
                return response.mainMenu.notRegistered(nama);
            }

            await userRepo.updateSession(from, {
                currentAction: "create_report",
                step: "ASK_LOCATION",
                data: {},
            });

            return response.mainMenu.askLocation(nama);
        }

        // === Cek status laporan (Opsi 2) ===
        if (input === "2" || GeminiMenuContext === "2") {
            await userRepo.updateSession(from, {
                currentAction: "check_report",
                step: "ASK_REPORT_ID",
            });

            return response.mainMenu.askReportId(nama);
        }

        // === Input tidak dikenali ===
        return response.mainMenu.unknownOption(nama);

    } catch (err) {
        console.error("Error di mainMenuHandler:", err);

        // Tangani error fallback jika terjadi kesalahan di atas
        try {
            const user = await userProfileRepo.findByFrom(from);
            const nama = user?.name || "Warga";
            return responseError.defaultErrorMessage(nama);
        } catch {
            return "Terjadi kesalahan. Silakan coba lagi nanti.";
        }
    }
};