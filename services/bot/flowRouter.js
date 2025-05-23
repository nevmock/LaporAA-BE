const mainMenuHandler = require("./handlers/mainMenuHandler");
const signupHandler = require("./handlers/signupHandler");
const createReportHandler = require("./handlers/createReportHandler");
const checkReportHandler = require("./handlers/checkReportHandler");
const ratingHandler = require("./handlers/ratingHandler");
const feedbackHandler = require("./handlers/feedbackHandler");
const fallbackHandler = require("./handlers/fallbackHandler");

/**
 * Fungsi router utama untuk menentukan handler berdasarkan step dan action.
 * 
 * @param {Object} params
 * @param {string} params.from - Nomor WhatsApp pengirim
 * @param {string|Object} params.input - Pesan pengguna (text, lokasi, atau foto)
 * @param {Object} params.session - Session aktif pengguna
 * @param {string} params.nama - Nama pengguna (jika tersedia)
 * 
 * @returns {string} - Respon bot yang sesuai dengan alur saat ini
 */
exports.flowRouter = async ({ from, input, session, nama }) => {
    const step = session.step;
    const action = session.currentAction;

    // Tangani jika pengguna sedang memberi rating setelah konfirmasi penyelesaian
    if (step === "WAITING_FOR_RATING") {
        return await ratingHandler(from, input, session, nama);
    }

    // Tangani jika pengguna memiliki laporan yang sedang menunggu feedback "puas/belum"
    if (session.pendingFeedbackFor && session.pendingFeedbackFor.length > 0) {
        return await feedbackHandler(from, input, session, nama);
    }

    // Tangani jika pengguna belum memilih action apapun dan sedang berada di menu utama
    if (!action && step === "MAIN_MENU") {
        return await mainMenuHandler(from, input);
    }

    // Tangani jika pengguna sedang dalam proses pendaftaran
    if (action === "signup") {
        return await signupHandler(from, step, input);
    }

    // Tangani jika pengguna sedang membuat laporan baru
    if (action === "create_report") {
        return await createReportHandler(from, step, input);
    }

    // Tangani jika pengguna sedang melakukan pengecekan laporan
    if (action === "check_report") {
        return await checkReportHandler(from, step, input);
    }

    // Jika tidak cocok dengan semua kondisi di atas, jalankan fallback dan reset session
    return await fallbackHandler(from, step, input, session, nama);
};