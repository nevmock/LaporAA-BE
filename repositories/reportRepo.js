const Report = require("../models/Report");
const Tindakan = require("../models/Tindakan");
const UserProfile = require("../models/UserProfile");

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
        opd: [],
        photos: [],
        url: "",
        keterangan: "",
        status_laporan: "Menunggu Diproses OPD Terkait",
    });

    newReport.tindakan = defaultTindakan._id;
    await newReport.save();

    // Tambahkan sessionId ke reportHistory userProfile
    if (from && sessionId) {
        await UserProfile.findOneAndUpdate(
            { from },
            { $addToSet: { reportHistory: sessionId } }
        );
    }

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

// Toggle status is_pinned
exports.togglePinned = async (reportId) => {
    const report = await Report.findById(reportId);
    if (!report) {
        throw new Error('Report not found');
    }
    
    report.is_pinned = !report.is_pinned;
    await report.save();
    
    return report;
};

// Toggle status is_pinned by sessionId
exports.togglePinnedBySessionId = async (sessionId) => {
    const report = await Report.findOne({ sessionId });
    if (!report) {
        throw new Error('Report not found');
    }
    
    report.is_pinned = !report.is_pinned;
    await report.save();
    
    return await Report.findById(report._id)
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
};

// Find all pinned reports
exports.findAllPinned = async () => {
    return await Report.find({ is_pinned: true })
        .populate("user")
        .populate("tindakan")
        .populate("processed_by")
        .sort({ createdAt: -1 });
};

// Find pinned report by sessionId
exports.findPinnedBySessionId = async (sessionId) => {
    return await Report.findOne({ sessionId, is_pinned: true })
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
};

// Check pin status of a report by sessionId - returns report with pin status info
exports.checkPinStatusBySessionId = async (sessionId) => {
    const report = await Report.findOne({ sessionId })
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
    
    return report;
};

// Cari semua report milik user (from) yang status tindakannya belum 'Selesai Pengaduan'
exports.findActiveReportsByFrom = async (from) => {
    const reports = await Report.find({ from })
        .populate("tindakan");
    return reports.filter(r => r.tindakan && r.tindakan.status !== "Selesai Pengaduan");
};