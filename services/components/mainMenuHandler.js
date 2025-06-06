const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const { menuContext } = require("../../utils/openAiHelper");
const mainMenuResponse = require("../responseMessage/mainMenuResponse");

module.exports = async (from, input) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";
    const GeminiMenuContext = await menuContext(input);

    // Opsi 1: Buat laporan baru
    if (input === "1" || GeminiMenuContext === "1") {
        
        // Jika belum terdaftar, alihkan ke proses pendaftaran
        if (!user) {
            await userRepo.updateSession(from, {
                currentAction: "signup",
                step: "ASK_NAME",
            });
            return mainMenuResponse.belumTerdaftar();
        }

        // Jika sudah terdaftar, mulai proses pembuatan laporan
        await userRepo.updateSession(from, {
            currentAction: "create_report",
            step: "ASK_MESSAGE",
            data: {},
        });

        return mainMenuResponse.mulaiLaporan(sapaan, nama);
    }

    // Opsi 2: Cek status laporan berdasarkan sessionId
    if (input === "2" || GeminiMenuContext === "2") {
        
        await userRepo.updateSession(from, {
            currentAction: "check_report",
            step: "ASK_REPORT_ID",
        });
        return mainMenuResponse.mintaIdLaporan(sapaan, nama);
    }

    // Tanggapan default jika input tidak dikenali
    return mainMenuResponse.mainMenuDefault();
};
