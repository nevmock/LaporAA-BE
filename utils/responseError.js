// utils/responseError.js

// Helper untuk random template
const getRandomTemplate = (templates, ...args) => {
    const index = Math.floor(Math.random() * templates.length);
    return templates[index](...args);
};

// === ERROR DEFAULT ===
const defaultErrorTemplates = [
    (nama) => `Maaf ${nama}, terjadi kesalahan internal. Silakan coba beberapa saat lagi atau ketik *menu* untuk kembali.`,
    (nama) => `Ups, ada error sistem nih ${nama}. Coba ketik *menu* untuk mulai ulang atau tunggu sebentar.`,
    (nama) => `${nama}, sistem kami sedang mengalami gangguan. Silakan coba lagi sebentar ya.`,
];

// === NOT FOUND ===
const notFoundTemplates = [
    (nama) => `Data yang dicari tidak ditemukan, ${nama}. Mungkin sudah dihapus atau belum tersedia.`,
    (nama) => `Maaf ${nama}, kami tidak bisa menemukan data tersebut. Silakan cek kembali atau coba lagi nanti.`,
    (nama) => `${nama}, sepertinya data yang dimaksud belum tersedia. Pastikan ID atau informasinya sudah benar.`,
];

// === EXPORT ===
module.exports = {
    defaultErrorMessage: (nama) => getRandomTemplate(defaultErrorTemplates, nama),
    notFoundMessage: (nama) => getRandomTemplate(notFoundTemplates, nama),
};
