const Tindakan = require("../models/Tindakan");

exports.update = async ({ reportId, hasil, trackingId, prioritas, situasi, status, opd, disposisi, photos, url, keterangan, status_laporan }) => {
    const tindakan = await Tindakan.findOne({ report: reportId });
    if (!tindakan) throw new Error("Tindakan belum tersedia untuk report ini.");

    tindakan.hasil = hasil;
    tindakan.trackingId = trackingId;
    tindakan.prioritas = prioritas;
    tindakan.situasi = situasi;
    tindakan.status = status;
    tindakan.opd = opd;
    tindakan.disposisi = disposisi;
    tindakan.photos = photos;
    tindakan.updatedAt = new Date();
    tindakan.url = url;
    tindakan.keterangan = keterangan;
    tindakan.status_laporan = status_laporan;

    await tindakan.save();
    return tindakan;
};

exports.appendKesimpulan = async (tindakanId, newText) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");

    tindakan.kesimpulan.push({
        text: newText,
        timestamp: new Date(),
    });

    tindakan.updatedAt = new Date();
    await tindakan.save();

    return tindakan;
};

exports.updateKesimpulanByIndex = async (tindakanId, index, newText) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");

    if (!tindakan.kesimpulan || index < 0 || index >= tindakan.kesimpulan.length) {
        throw new Error("Index kesimpulan tidak valid.");
    }

    tindakan.kesimpulan[index].text = newText;
    tindakan.kesimpulan[index].timestamp = new Date();
    tindakan.updatedAt = new Date();

    await tindakan.save();
    return tindakan;
};

exports.deleteKesimpulanByIndex = async (tindakanId, index) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");

    if (!tindakan.kesimpulan || index < 0 || index >= tindakan.kesimpulan.length) {
        throw new Error("Index kesimpulan tidak valid.");
    }

    tindakan.kesimpulan.splice(index, 1);
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

exports.findAll = async (query) => {
    return await Tindakan.find(query).populate("report");
};

exports.updateRatingById = async (tindakanId, rating) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");

    tindakan.rating = rating;
    tindakan.updatedAt = new Date();
    await tindakan.save();

    return tindakan;
};