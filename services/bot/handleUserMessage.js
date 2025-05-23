const { flowRouter } = require("./flowRouter");
const userRepo = require("../repositories/userRepo");
const userProfileRepo = require("../repositories/userProfileRepo");
const response = require("../utils/response");
const responseError = require("../utils/responseError");
const { startContext } = require("../utils/openAiHelper");

/**
 * Fungsi utama untuk menangani pesan masuk dari pengguna WhatsApp.
 * Fungsi ini akan mengatur alur percakapan berdasarkan session dan isi pesan.
 * 
 * @param {Object} param0 - Objek input dari webhook
 * @param {string} param0.from - Nomor WhatsApp pengirim pesan
 * @param {string|Object} param0.message - Isi pesan yang dikirim (bisa string atau objek lokasi/gambar)
 * 
 * @returns {string} - Respon yang akan dikirim kembali ke pengguna
 */

exports.handleUserMessage = async ({ from, message }) => {
    try {
        // Ambil session pengguna atau buat baru jika belum ada
        const session = await userRepo.getOrCreateSession(from);

        // Ambil profil pengguna dari database
        const user = await userProfileRepo.findByFrom(from);
        const nama = user?.name || "Warga";

        // Normalisasi input menjadi lowercase string jika berupa teks
        const input = typeof message === "string" ? message.trim().toLowerCase() : message;

        // Jika pengguna mengetik 'menu' atau 'reset', lakukan reset session
        if (input === "menu" || input === "reset") {
            await userRepo.resetSession(from);
            return response.resetMessage(nama);
        }

        // Jika berada di menu utama dan belum ada currentAction, cek apakah input merupakan sapaan
        if (session.step === "MAIN_MENU" && !session.currentAction) {
            const isGreeting = await startContext(input);
            if (isGreeting === "true") {
                return response.greetingMessage(nama);
            }
        }

        // Lanjutkan proses ke flowRouter untuk penanganan lanjutan berdasarkan step dan action
        return await flowRouter({ from, input, session, nama });

    } catch (err) {
        // Tangani error internal dan fallback jika nama user tidak bisa diambil
        console.error("❌ Terjadi error di handleUserMessage:", err);
        try {
            const user = await userProfileRepo.findByFrom(from);
            const nama = user?.name || "Warga";
            return responseError.defaultErrorMessage(nama);
        } catch {
            return "Terjadi kesalahan. Silakan coba lagi nanti.";
        }
    }
};