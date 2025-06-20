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
        .populate("tindakan")
        .populate("processed_by");
};

exports.findAll = async () => {
    return await Report.find()
        .populate("user")
        .populate("tindakan")
        .populate("processed_by")
        .sort({ createdAt: -1 });
};

exports.findBySessionId = async (sessionId) => {
    return await Report.findOne({ sessionId })
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
};

exports.findById = async (id) => {
    return await Report.findById(id)
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
};

exports.findByTindakanId = async (tindakanId) => {
    return await Report.findOne({ tindakan: tindakanId })
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
};

exports.deleteManyBySessionIds = async (sessionIds) => {
    const reports = await Report.find({ sessionId: { $in: sessionIds } });
    const tindakanIds = reports.map((r) => r.tindakan).filter(Boolean);

    if (tindakanIds.length > 0) {
        await Tindakan.deleteMany({ _id: { $in: tindakanIds } });
    }

    await Report.deleteMany({ sessionId: { $in: sessionIds } });

    return { message: `${reports.length} report dan tindakan berhasil dihapus` };
};

// Update processed_by di Report
exports.updateProcessedBy = async (reportId, userLoginId) => {
    return await Report.findByIdAndUpdate(
        reportId,
        { processed_by: userLoginId },
        { new: true }
    );
};