const Tindakan = require("../models/Tindakan");

exports.update = async ({ reportId, hasil, kesimpulan, status, situasi, opd, photos }) => {
    const tindakan = await Tindakan.findOne({ report: reportId });
    if (!tindakan) throw new Error("Tindakan belum tersedia untuk report ini.");

    tindakan.hasil = hasil;
    tindakan.kesimpulan = kesimpulan;
    tindakan.status = status;
    tindakan.situasi = situasi;
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
    return await Tindakan.findById(id);
};
