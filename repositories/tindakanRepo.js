const Tindakan = require("../models/Tindakan");

exports.update = async ({ reportId, hasil, kesimpulan, trackingId, prioritas, situasi, status, opd, photos }) => {
    const tindakan = await Tindakan.findOne({ report: reportId });
    if (!tindakan) throw new Error("Tindakan belum tersedia untuk report ini.");

    tindakan.hasil = hasil;
    tindakan.kesimpulan = kesimpulan;
    tindakan.trackingId = trackingId;
    tindakan.prioritas = prioritas;
    tindakan.situasi = situasi;
    tindakan.status = status;
    tindakan.opd = opd;
    tindakan.photos = photos;
    tindakan.updatedAt = new Date();

    await tindakan.save();
    return tindakan;
};

exports.findByReportId = async (reportId) => {
    return await Tindakan.find({ report: reportId });
};

exports.findById = async (id) => {
    return await Tindakan.findById(id).populate("report");
};

// ✨ Tambahkan ini:
exports.updateRatingById = async (tindakanId, rating) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");

    tindakan.rating = rating;
    tindakan.updatedAt = new Date();
    await tindakan.save();

    return tindakan;
};