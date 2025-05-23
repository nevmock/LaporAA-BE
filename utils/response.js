// utils/response.js

// Helper untuk ambil pesan random dari array template
const getRandomTemplate = (templates, ...args) => {
    const index = Math.floor(Math.random() * templates.length);
    return templates[index](...args);
};

// === MAIN MENU ===
const greetingTemplates = [
    (nama) => `Halo ${nama}! Selamat datang di *Lapor AA*. Kamu bisa buat laporan keluhan atau cek status laporan di Kabupaten Bekasi.`,
    (nama) => `Hai ${nama}, selamat datang! Di sini kamu bisa menyampaikan keluhan atau memantau laporan yang sudah kamu kirim.`,
    (nama) => `Selamat datang ${nama}! Lapor AA siap bantu keluhan warga Kabupaten Bekasi. Mau buat laporan baru atau cek status?`,
    (nama) => `Halo ${nama}, terima kasih sudah menghubungi Lapor AA. Yuk, mulai dengan buat laporan atau cek status sebelumnya.`,
    (nama) => `Halo ${nama}, kami siap bantu! Mau melaporkan kejadian atau cek perkembangan laporan sebelumnya?`,
    (nama) => `Hai ${nama}, di Lapor AA kamu bisa bikin laporan warga atau memeriksa statusnya. Silakan pilih.`,
    (nama) => `Selamat datang ${nama} di Lapor AA! Silakan buat laporan baru atau lihat laporan yang sudah ada.`,
    (nama) => `Halo ${nama}, silakan buat laporan keluhan atau cek laporan yang sudah kamu kirim sebelumnya.`,
    (nama) => `Hai ${nama}, sistem kami siap mencatat laporanmu atau menampilkan status laporan yang sudah ada.`,
    (nama) => `Halo ${nama}, selamat datang! Ada yang bisa kami bantu hari ini? Laporan baru atau cek status?`
];

const resetTemplates = [
    (nama) => `Halo ${nama}, sesi telah direset. Silakan pilih apakah ingin *buat laporan* atau *cek status laporan*?`,
    (nama) => `Baik ${nama}, ayo mulai dari awal. Kamu mau buat laporan atau cek status laporan yang sudah ada?`,
    (nama) => `${nama}, silakan pilih layanan yang kamu butuhkan: ketik *1* untuk buat laporan atau *2* untuk cek laporan.`,
];

const invalidMenuTemplates = [
    (nama) => `Maaf ${nama}, pilihan yang kamu masukkan belum dikenali. Coba ketik *menu* untuk melihat opsi yang tersedia.`,
    (nama) => `Ups, ${nama} kayaknya input-nya belum sesuai. Ketik *menu* untuk kembali ke menu utama.`,
    (nama) => `${nama}, sistem kami belum mengenali pilihan tersebut. Ketik *menu* ya untuk mulai ulang.`,
];

// === RATING ===
const invalidRatingTemplates = [
    (nama) => `Rating tidak valid, ${nama}. Mohon berikan angka antara 1 hingga 5.`,
    (nama) => `Maaf ${nama}, nilai rating harus berupa angka dari 1 sampai 5.`,
    (nama) => `Halo ${nama}, hanya angka 1 sampai 5 yang bisa digunakan sebagai rating ya.`,
];

const successRatingTemplates = [
    (nama, rating) => `Terima kasih ${nama} atas rating ${rating}-nya! Masukanmu sangat berarti bagi peningkatan layanan kami.`,
    (nama, rating) => `Rating ${rating} dari ${nama} sudah kami terima. Kami akan terus berusaha menjadi lebih baik.`,
    (nama, rating) => `Kami apresiasi rating ${rating} dari kamu, ${nama}. Terima kasih atas partisipasinya!`,
];

const ratingErrorTemplates = [
    (nama) => `Terjadi kesalahan saat menyimpan rating kamu, ${nama}. Silakan coba lagi nanti.`,
    (nama) => `Mohon maaf ${nama}, sistem sedang bermasalah. Rating belum bisa disimpan, coba sebentar lagi ya.`,
    (nama) => `Ups, ada error teknis saat menyimpan rating dari ${nama}. Kami akan segera perbaiki.`,
];

// === FEEDBACK ===
const rejectedReportTemplates = [
    (nama, sessionId, kesimpulan) => `Laporan ${sessionId} dari ${nama} *tidak dapat ditindaklanjuti* dan telah *ditolak* oleh petugas.\nAlasan: ${kesimpulan || "Tidak tersedia"}\nTerima kasih atas partisipasinya.`,
    (nama, sessionId, kesimpulan) => `Maaf ${nama}, laporan ${sessionId} tidak bisa diproses lebih lanjut.\nAlasan: ${kesimpulan || "Belum dijelaskan"}.\nTerima kasih sudah melapor.`,
];

const feedbackPuasTemplates = [
    (nama, sessionId) => `Terima kasih ${nama} atas tanggapannya. Laporan ${sessionId} akan kami tutup.\nSebelum itu, boleh beri kami rating 1–5 untuk evaluasi layanan kami?`,
    (nama, sessionId) => `Noted, ${nama}. Laporan ${sessionId} dianggap selesai. Yuk bantu beri rating (1–5) sebagai feedback!`,
];

const feedbackBelumTemplates = [
    (nama, sessionId) => `Baik ${nama}, laporan ${sessionId} akan kami tindaklanjuti ulang. Maaf atas ketidaknyamanannya.`,
    (nama, sessionId) => `Terima kasih ${nama}, laporan ${sessionId} akan kami proses kembali.`,
];

const pendingFeedbackTemplates = [
    (nama, sessionId) => `Hai ${nama}, kamu masih punya laporan ${sessionId} yang menunggu konfirmasi penyelesaian. Balas dengan *puas* jika sudah selesai atau *belum* jika masih ada kendala.`,
    (nama, sessionId) => `Reminder ${nama}, ada laporan ${sessionId} yang belum dikonfirmasi. Balas *puas* jika selesai, atau *belum* jika belum tuntas.`,
];

// === TINDAKAN ===
const daruratTemplates = [
    (nama) => `Terima kasih ${nama} telah menghubungi kami. Karena situasinya *darurat*, mohon segera hubungi:\n📞 Call Center Kabupaten Bekasi: 021-xxxxxxx\n📌 Atau langsung hubungi OPD terdekat.`,
    (nama) => `${nama}, karena ini bersifat *darurat*, mohon hubungi call center atau pihak berwenang setempat secepatnya.`,
];

const tindakanSelesaiTemplates = [
    (nama, sessionId, kesimpulan) => `Hai ${nama}, laporan ${sessionId} telah kami selesaikan. Berikut ringkasannya:\n${kesimpulan}\n\nApakah sudah puas dengan hasil penanganan ini?\n➡️ Balas *puas* jika ya\n➡️ Balas *belum* jika belum.`,
    (nama, sessionId, kesimpulan) => `Laporan ${sessionId} dari ${nama} telah selesai ditangani. Rincian:\n${kesimpulan}\nSilakan balas dengan *puas* atau *belum*.`,
];

const tindakanDitolakTemplates = [
    (nama, sessionId, keterangan) => `Mohon maaf ${nama}, laporan ${sessionId} tidak bisa ditindaklanjuti.\nAlasan: ${keterangan || "Tidak dijelaskan"}.\nSilakan buat laporan baru dengan informasi yang lebih lengkap.`,
    (nama, sessionId, keterangan) => `Laporan ${sessionId} ditolak karena: ${keterangan || "Belum ada alasan yang dijelaskan"}.\nKami sarankan buat laporan baru ya, ${nama}.`,
];

// === SIGNUP ===
const askSexTemplates = [
    (nama) => `Baik ${nama}, sekarang sebutkan jenis kelamin kamu ya (Laki-laki / Perempuan).`,
    (nama) => `${nama}, tolong sebutkan jenis kelamin sesuai KTP (Laki-laki atau Perempuan).`,
];

const askNikTemplates = [
    (nama) => `Sekarang ${nama}, masukkan NIK kamu (16 digit sesuai KTP).`,
    (nama) => `Mohon isi NIK kamu, ${nama}. Harus 16 angka sesuai KTP yang masih berlaku.`,
];

const invalidNikTemplates = [
    (nama) => `NIK yang kamu masukkan tidak valid, ${nama}. Harus terdiri dari 16 digit angka. Silakan coba lagi.`,
    (nama) => `Oops ${nama}, NIK-nya belum sesuai. Harus 16 digit ya, coba ketik ulang.`,
];

const askAddressTemplates = [
    (nama) => `Silakan ${nama}, masukkan alamat domisili sesuai KTP.`,
    (nama) => `${nama}, ketik alamat kamu sesuai dengan KTP.`,
];

const confirmDataTemplates = [
    (nama, data) => `Berikut data yang akan disimpan, ${nama}:\n\n📝 Nama: ${data.name}\n🆔 NIK: ${data.nik}\n🏠 Alamat: ${data.address}\n👤 Jenis Kelamin: ${data.jenis_kelamin}\n\nKetik *kirim* untuk menyimpan, atau *batal* untuk membatalkan.`,
];

const saveSuccessTemplates = [
    (nama) => `Terima kasih ${nama}, data berhasil disimpan.\nSilakan kirim *lokasi kejadian* dengan fitur *Kirim Lokasi* di WhatsApp.`,
];

const signupCancelledTemplates = [
    (nama) => `Proses pendaftaran dibatalkan, ${nama}. Balas pesan ini untuk kembali ke menu utama.`,
];

const confirmInstructionTemplates = [
    (nama) => `${nama}, ketik *kirim* untuk menyimpan, atau *batal* untuk membatalkan proses.`,
];

// === MAIN MENU HANDLER ===
const notRegisteredTemplates = [
    (nama) => `Hai ${nama}, datamu belum terdaftar. Sebelum membuat laporan, mohon masukkan nama lengkap sesuai KTP.`,
    (nama) => `${nama}, kamu belum terdaftar. Silakan isi data diri terlebih dahulu sebelum buat laporan.`,
];

const askLocationTemplates = [
    (nama) => `Silakan ${nama}, kirim *lokasi kejadian* dengan fitur *Kirim Lokasi* di WhatsApp.`,
    (nama) => `Untuk lanjut, ${nama} bisa kirimkan lokasi kejadian laporan menggunakan fitur share location di WhatsApp.`,
];

const askReportIdTemplates = [
    (nama) => `${nama}, silakan masukkan *ID laporan* (contoh: 12345678) untuk cek status laporanmu.`,
    (nama) => `Masukkan ID laporan kamu ya, ${nama}. Contoh: 12345678.`,
];

const unknownMenuOptionTemplates = [
    (nama) => `Pilihan tidak dikenali, ${nama}. Silakan ketik *menu* untuk melihat pilihan yang tersedia.`,
    (nama) => `Maaf ${nama}, sistem tidak mengenali pilihan tersebut. Coba ketik *menu* ya.`,
];

// === CREATE REPORT ===
const askLocationInvalidTemplates = [
    (nama) => `Hai ${nama}, mohon kirimkan lokasi kejadian menggunakan fitur *Kirim Lokasi* di WhatsApp.`,
    (nama) => `Ups ${nama}, lokasi harus dikirim dengan fitur share location ya. Coba ulangi.`,
];

const askMessageTemplates = [
    (nama) => `${nama}, sekarang tuliskan secara singkat kejadian atau keluhan yang ingin kamu laporkan.`,
    (nama) => `Silakan ${nama}, beri penjelasan ringkas tentang kejadian yang ingin dilaporkan.`,
];

const askPhotoTemplates = [
    (nama) => `${nama}, kirim *setidaknya 1 foto dan maksimal 3 foto* kejadian. Setelah 1 foto dikirim, bisa langsung lanjut.`,
    (nama) => `Mohon kirimkan foto kejadian, ${nama}. Bisa kirim hingga 3 foto ya.`,
];

const photoLimitReachedTemplates = [
    (nama) => `${nama}, kamu sudah mengirim 3 foto sebagai batas maksimum. Ketik *kirim* untuk lanjut atau *batal* untuk membatalkan.`,
];

const photoReceivedTemplates = [
    (nama, remaining) => `${nama}, foto berhasil diterima. Kamu bisa kirim ${remaining} foto lagi, atau ketik *kirim* jika sudah cukup.`,
];

const photoErrorTemplates = [
    (nama) => `${nama}, kami tidak dapat memproses foto tersebut. Mohon kirim ulang atau ketik *batal* jika ingin membatalkan.`,
];

const minPhotoRequiredTemplates = [
    (nama) => `Setidaknya 1 foto diperlukan, ${nama}. Silakan kirim foto terlebih dahulu sebelum melanjutkan.`,
];

const reportPreviewTemplates = [
    (nama, data) => `Berikut ringkasan laporan kamu, ${nama}:\n📍 Lokasi: ${data.desa}, ${data.kecamatan}, ${data.kabupaten}\n📝 Keluhan: ${data.message}\n📸 Foto: ${data.photos.length} file\n\nKetik *konfirmasi* untuk mengirim laporan, atau *batal* untuk membatalkan.`,
];

const reportSuccessTemplates = [
    (nama, nomor) => `Terima kasih ${nama}, laporan berhasil dikirim dengan ID *${nomor}*. Simpan ID ini untuk cek status laporanmu.`,
];

const reportSaveErrorTemplates = [
    (nama) => `Maaf ${nama}, terjadi kesalahan saat menyimpan laporan. Coba lagi nanti atau ketik *reset* untuk ulang.`,
];

const reportCancelledTemplates = [
    (nama) => `Proses laporan dibatalkan, ${nama}. Balas pesan ini kapan saja untuk membuat laporan baru.`,
];

// === CHECK REPORT ===
const reportNotFoundTemplates = [
    (nama, id) => `Nomor laporan *${id}* tidak ditemukan, ${nama}. Silakan cek ulang atau ketik *menu* untuk kembali.`,
    (nama, id) => `Maaf ${nama}, laporan dengan ID *${id}* tidak ada di sistem. Coba lagi atau ketik *menu*.`,
];

const reportDetailTemplates = [
    (nama, nomor, report, tindakan) => `Halo ${nama}, berikut detail laporanmu:\n\n🆔 *Laporan ${nomor}*\n📍 Lokasi: ${report.location.desa}, ${report.location.kecamatan}, ${report.location.kabupaten}\n📅 Tanggal: ${report.createdAt.toLocaleDateString("id-ID")}\n⏰ Waktu: ${report.createdAt.toLocaleTimeString("id-ID")}\n📝 Isi Laporan: ${report.message}\n\n📌 Tindakan Terbaru:\n• OPD Terkait: ${tindakan?.opd || "-"}\n• Kedaruratan: ${tindakan?.situasi || "-"}\n• Status: ${tindakan?.status || "-"}\n• Disposisi: ${tindakan?.disposisi || "-"}\n\nKami akan segera menindaklanjuti laporan ini.`,
];

const unknownStepTemplates = [
    (nama) => `Pilihan tidak dikenali, ${nama}. Ketik *menu* untuk melihat layanan yang tersedia.`,
];

const backToMenuTemplates = [
    (nama) => `Baik ${nama}, kembali ke menu utama. Silakan pilih apakah ingin *buat laporan* atau *cek laporan*.`,
];

// === EXPORT ===
module.exports = {
    // main menu
    greetingMessage: (nama) => getRandomTemplate(greetingTemplates, nama),
    resetMessage: (nama) => getRandomTemplate(resetTemplates, nama),
    invalidMenuMessage: (nama) => getRandomTemplate(invalidMenuTemplates, nama),

    // rating
    invalidRating: (nama) => getRandomTemplate(invalidRatingTemplates, nama),
    successRating: (nama, rating) => getRandomTemplate(successRatingTemplates, nama, rating),
    ratingError: (nama) => getRandomTemplate(ratingErrorTemplates, nama),

    // feedback
    rejectedReport: (nama, sessionId, kesimpulan) => getRandomTemplate(rejectedReportTemplates, nama, sessionId, kesimpulan),
    feedbackPuas: (nama, sessionId) => getRandomTemplate(feedbackPuasTemplates, nama, sessionId),
    feedbackBelum: (nama, sessionId, remaining) => getRandomTemplate(feedbackBelumTemplates, nama, sessionId, remaining),
    pendingFeedback: (nama, sessionId) => getRandomTemplate(pendingFeedbackTemplates, nama, sessionId),

    // tindakan
    daruratMessage: (nama) => getRandomTemplate(daruratTemplates, nama),
    tindakanSelesaiMessage: (nama, sessionId, kesimpulan) => getRandomTemplate(tindakanSelesaiTemplates, nama, sessionId, kesimpulan),
    tindakanDitolakMessage: (nama, sessionId, keterangan) => getRandomTemplate(tindakanDitolakTemplates, nama, sessionId, keterangan),

    // signup
    signup: {
        askSex: (nama) => getRandomTemplate(askSexTemplates, nama),
        askNik: (nama) => getRandomTemplate(askNikTemplates, nama),
        invalidNik: (nama) => getRandomTemplate(invalidNikTemplates, nama),
        askAddress: (nama) => getRandomTemplate(askAddressTemplates, nama),
        confirmData: (nama, data) => getRandomTemplate(confirmDataTemplates, nama, data),
        saveSuccess: (nama) => getRandomTemplate(saveSuccessTemplates, nama),
        cancelled: (nama) => getRandomTemplate(signupCancelledTemplates, nama),
        confirmInstruction: (nama) => getRandomTemplate(confirmInstructionTemplates, nama),
    },

    // main menu
    mainMenu: {
        notRegistered: (nama) => getRandomTemplate(notRegisteredTemplates, nama),
        askLocation: (nama) => getRandomTemplate(askLocationTemplates, nama),
        askReportId: (nama) => getRandomTemplate(askReportIdTemplates, nama),
        unknownOption: (nama) => getRandomTemplate(unknownMenuOptionTemplates, nama),
    },

    report: {
        askLocationInvalid: (nama) => getRandomTemplate(askLocationInvalidTemplates, nama),
        askMessage: (nama) => getRandomTemplate(askMessageTemplates, nama),
        askPhoto: (nama) => getRandomTemplate(askPhotoTemplates, nama),
        photoLimitReached: (nama) => getRandomTemplate(photoLimitReachedTemplates, nama),
        photoReceived: (nama, remaining) => getRandomTemplate(photoReceivedTemplates, nama, remaining),
        photoError: (nama) => getRandomTemplate(photoErrorTemplates, nama),
        minPhotoRequired: (nama) => getRandomTemplate(minPhotoRequiredTemplates, nama),
        reportPreview: (nama, data) => getRandomTemplate(reportPreviewTemplates, nama, data),
        reportSuccess: (nama, nomor) => getRandomTemplate(reportSuccessTemplates, nama, nomor),
        reportSaveError: (nama) => getRandomTemplate(reportSaveErrorTemplates, nama),
        reportCancelled: (nama) => getRandomTemplate(reportCancelledTemplates, nama),
    },

    checkReport: {
        askReportId: (nama) => getRandomTemplate(askReportIdTemplates, nama),
        reportNotFound: (nama, id) => getRandomTemplate(reportNotFoundTemplates, nama, id),
        reportDetail: (nama, nomor, report, tindakan) => getRandomTemplate(reportDetailTemplates, nama, nomor, report, tindakan),
        unknownStep: (nama) => getRandomTemplate(unknownStepTemplates, nama),
        backToMenu: (nama) => getRandomTemplate(backToMenuTemplates, nama),
    }
};