const Report = require("../models/Report");
const Tindakan = require("../models/Tindakan");
const UserProfile = require("../models/UserProfile");
const RealTimeService = require("../services/realTimeService");

// Helper function to ensure photos field has consistent structure
const normalizePhotos = (photos) => {
    if (!Array.isArray(photos)) return [];
    
    return photos.map(photo => {
        if (typeof photo === 'string') {
            return {
                url: photo,
                type: 'image',
                caption: '',
                originalUrl: photo
            };
        }
        
        if (typeof photo === 'object' && photo !== null) {
            return {
                url: photo.url || photo,
                type: photo.type || 'image',
                caption: photo.caption || '',
                originalUrl: photo.originalUrl || photo.url || photo
            };
        }
        
        return {
            url: '',
            type: 'image',
            caption: '',
            originalUrl: ''
        };
    });
};

// Helper function to transform report object after fetch
const transformReportPhotos = (report) => {
    if (!report) return report;
    
    if (report.toObject) {
        report = report.toObject();
    }
    
    if (report.photos) {
        report.photos = normalizePhotos(report.photos);
    }
    
    return report;
};

exports.create = async ({ sessionId, from, user, location, message, photos, url, keterangan, status_laporan }) => {
    // Normalize photos before creating
    const normalizedPhotos = normalizePhotos(photos);
    
    const newReport = await Report.create({ 
        sessionId, 
        from, 
        user, 
        location, 
        message, 
        photos: normalizedPhotos, 
        url, 
        keterangan, 
        status_laporan 
    });

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

    // Emit real-time notification menggunakan service
    try {
        // Gunakan global io instance yang di-set di app.js
        const io = global.socketIO;
        if (io) {
            // Get user data for notification
            const user = await UserProfile.findOne({ from });
            const locationText = location.description || 
                (location.desa && location.kecamatan ? `${location.desa}, ${location.kecamatan}` : '') ||
                (location.latitude && location.longitude ? `${location.latitude}, ${location.longitude}` : '') ||
                'Lokasi tidak diketahui';
            
            await RealTimeService.emitNewReportNotification(io, {
                reportId: newReport._id,
                sessionId: sessionId,
                from: from,
                userName: user?.name || 'Anonim',
                message: message,
                location: locationText,
                coordinates: location.latitude && location.longitude ? {
                    lat: location.latitude,
                    lng: location.longitude
                } : null
            });
        }
    } catch (error) {
        console.warn('⚠️ Failed to emit real-time update:', error.message);
    }

    // Tambahkan sessionId ke reportHistory userProfile
    if (from && sessionId) {
        await UserProfile.findOneAndUpdate(
            { from },
            { $addToSet: { reportHistory: sessionId } }
        );
    }

    return transformReportPhotos(await Report.findById(newReport._id)
        .populate("user")
        .populate("tindakan")
        .populate("processed_by"));
};

exports.findAll = async () => {
    const reports = await Report.find()
        .populate("user")
        .populate("tindakan")
        .populate("processed_by")
        .sort({ createdAt: -1 });
    
    return reports.map(transformReportPhotos);
};

exports.findBySessionId = async (sessionId) => {
    const report = await Report.findOne({ sessionId })
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
    
    return transformReportPhotos(report);
};

exports.findById = async (id) => {
    const report = await Report.findById(id)
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
    
    return transformReportPhotos(report);
};

exports.findByTindakanId = async (tindakanId) => {
    const report = await Report.findOne({ tindakan: tindakanId })
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
    
    return transformReportPhotos(report);
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
    
    const updatedReport = await Report.findById(report._id)
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
    
    return transformReportPhotos(updatedReport);
};

// Find all pinned reports
exports.findAllPinned = async () => {
    const reports = await Report.find({ is_pinned: true })
        .populate("user")
        .populate("tindakan")
        .populate("processed_by")
        .sort({ createdAt: -1 });
    
    return reports.map(transformReportPhotos);
};

// Find pinned report by sessionId
exports.findPinnedBySessionId = async (sessionId) => {
    const report = await Report.findOne({ sessionId, is_pinned: true })
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
    
    return transformReportPhotos(report);
};

// Check pin status of a report by sessionId - returns report with pin status info
exports.checkPinStatusBySessionId = async (sessionId) => {
    const report = await Report.findOne({ sessionId })
        .populate("user")
        .populate("tindakan")
        .populate("processed_by");
    
    return transformReportPhotos(report);
};

// Cari semua report milik user (from) yang status tindakannya belum 'Selesai Pengaduan'
exports.findActiveReportsByFrom = async (from) => {
    const reports = await Report.find({ from })
        .populate("tindakan");
    
    const activeReports = reports.filter(r => r.tindakan && r.tindakan.status !== "Selesai Pengaduan");
    return activeReports.map(transformReportPhotos);
};