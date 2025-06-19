const Report = require("../models/Report");
const Tindakan = require("../models/Tindakan");

const diverifikasiStatuses = [
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditutup"
];

async function countAllReports() {
    return await Report.countDocuments();
}

async function countVerifiedTindakans() {
    return await Tindakan.countDocuments({
        status: { $in: diverifikasiStatuses }
    });
}

module.exports = {
    countAllReports,
    countVerifiedTindakans
};
