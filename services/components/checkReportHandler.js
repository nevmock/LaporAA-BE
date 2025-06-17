const userRepo = require("../../repositories/userRepo");
const userProfileRepo = require("../../repositories/userProfileRepo");
const reportRepo = require("../../repositories/reportRepo");
const checkReportResponse = require("../responseMessage/checkReportResponse");

module.exports = async (from, step, input, sendReply) => {
    const user = await userProfileRepo.findByFrom(from);
    const nama = user?.name || "Warga/i";
    const jenisKelamin = user?.jenis_kelamin || "";
    const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

    const msg = input?.toLowerCase?.().trim() || "";

    // Step 1: Ask for the report ID
    if (step === "ASK_REPORT_ID") {
        // Handle if the user wants to go back to the main menu
        if (msg === "menu" || msg === "kembali") {
            await userRepo.resetSession(from);
            return sendReply(from, checkReportResponse.kembaliKeMenu(sapaan, nama));
        }

        // Validate if the input matches the expected session ID format:
        const sessionId = input;
        const nomorLaporan = sessionId;

        if (!nomorLaporan || isNaN(nomorLaporan)) {
            // If session ID is invalid, prompt the user to enter a valid report ID
            return sendReply(from, checkReportResponse.laporanTidakDitemukan(sapaan, nama));
        }

        try {
            // Try to find the report by session ID
            const report = await reportRepo.findBySessionId(sessionId);

            if (!report) {
                // If no report found, inform the user
                return sendReply(from, checkReportResponse.laporanTidakDitemukan(sapaan, nama, nomorLaporan));
            }

            // If report is found, display the details and reset the session
            await userRepo.resetSession(from);
            return sendReply(from, checkReportResponse.detailLaporan(sapaan, nama, nomorLaporan, report));

        } catch (error) {
            // Handle errors like database issues
            console.error("Error fetching report:", error);
            return sendReply(from, checkReportResponse.errorMencariLaporan(sapaan, nama));
        }
    }

    // Fallback if the step does not match the expected steps
    await userRepo.resetSession(from);
    return sendReply(from, checkReportResponse.handlerDefault());
};