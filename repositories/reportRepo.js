const Report = require("../models/Report");
const Tindakan = require("../models/Tindakan");

exports.create = async ({ sessionId, from, user, location, message, photos, url, keterangan, status_laporan }) => {
    const newReport = await Report.create({ sessionId, from, user, location, message, photos, url, keterangan, status_laporan });

    const defaultTindakan = await Tindakan.create({
        report: newReport._id,
        hasil: "",
        kesimpulan: [],
        trackingId: null,
        prioritas: null,
        situasi: null,
        status: "Perlu Verifikasi",
        opd: "",
        photos: [],
        url: "",
        keterangan: "",
        status_laporan: "Menunggu Diproses OPD Terkait",
    });

    newReport.tindakan = defaultTindakan._id;
    await newReport.save();

    return await Report.findById(newReport._id)
        .populate("user")
        .populate("tindakan");
};

exports.findAll = async () => {
    return await Report.find()
        .populate("user")
        .populate("tindakan")
        .sort({ createdAt: -1 });
};

exports.findBySessionId = async (sessionId) => {
    return await Report.findOne({ sessionId })
        .populate("user")
        .populate("tindakan");
};

exports.findById = async (id) => {
    return await Report.findById(id)
        .populate("user")
        .populate("tindakan");
};

exports.findByTindakanId = async (tindakanId) => {
    return await Report.findOne({ tindakan: tindakanId })
        .populate("user")
        .populate("tindakan");
};