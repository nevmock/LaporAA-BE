const Tindakan = require("../models/Tindakan");

const diverifikasiStatuses = [
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditolak"
];

const selesaiStatuses = [
    "Selesai Pengaduan",
    "Ditolak"
];

async function countDiverifikasi() {
    return await Tindakan.countDocuments({
        status: { $in: diverifikasiStatuses }
    });
}

async function countSelesai() {
    return await Tindakan.countDocuments({
        status: { $in: selesaiStatuses }
    });
}

module.exports = {
    countDiverifikasi,
    countSelesai
};
