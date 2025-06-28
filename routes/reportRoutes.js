const express = require("express");
const router = express.Router();
const reportRepo = require("../repositories/reportRepo");
const Report = require("../models/Report");
const Tindakan = require("../models/Tindakan");

/* ---------- STATIC ENDPOINTS FIRST ---------- */
router.get("/test", async (req, res) => {
    try {
        const count = await Report.countDocuments();
        res.status(200).json({ 
            message: "API working", 
            totalReports: count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("❌ Error in test endpoint:", error);
        res.status(500).json({ message: "Database connection error" });
    }
});

router.get("/map", async (req, res) => {
    try {
        const basePipeline = [
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0]
                    },
                    statusScore: {
                        $indexOfArray: [
                            [
                                "Perlu Verifikasi",
                                "Verifikasi Situasi",
                                "Verifikasi Kelengkapan Berkas",
                                "Proses OPD Terkait",
                                "Selesai Penanganan",
                                "Selesai Pengaduan",
                                "Ditutup"
                            ],
                            "$tindakan.status"
                        ]
                    }
                }
            },
            {
                $sort: {
                    prioritasScore: -1,
                    statusScore: 1,
                    createdAt: -1
                }
            }
        ];

        const reports = await Report.aggregate(basePipeline);
        const populatedReports = await Report.populate(reports, { path: "user" });

        res.status(200).json({
            totalReports: populatedReports.length,
            data: populatedReports
        });
    } catch (error) {
        console.error("❌ Error fetching all reports:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.get("/summary", async (req, res) => {
    try {
        const summary = await Report.aggregate([
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            { $unwind: { path: "$tindakan", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$tindakan.status",
                    count: { $sum: 1 }
                }
            }
        ]);
        const result = {};
        summary.forEach(item => {
            result[item._id || "Tanpa Status"] = item.count;
        });
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error summary:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.get("/summary-laporan", async (req, res) => {
    try {
        const statusOrder = [
            "Perlu Verifikasi",
            "Verifikasi Situasi",
            "Verifikasi Kelengkapan Berkas",
            "Proses OPD Terkait",
            "Selesai Penanganan",
            "Selesai Pengaduan",
            "Ditutup"
        ];
        const searchQuery = req.query.search?.trim();
        const opdFilter = req.query.opd?.trim();
        const situasiFilter = req.query.situasi?.trim();

        const basePipeline = [
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "userlogins",
                    localField: "processed_by",
                    foreignField: "_id",
                    as: "processed_by"
                }
            },
            {
                $unwind: {
                    path: "$processed_by",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0]
                    },
                    statusScore: {
                        $indexOfArray: [statusOrder, "$tindakan.status"]
                    }
                }
            },
            ...(searchQuery ? [{
                $match: {
                    $or: [
                        { sessionId: { $regex: searchQuery, $options: "i" } },
                        { from: { $regex: searchQuery, $options: "i" } },
                        { "location.desa": { $regex: searchQuery, $options: "i" } },
                        { "location.kecamatan": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.opd": { $elemMatch: { $regex: searchQuery, $options: "i" } } },
                        { "user.name": { $regex: searchQuery, $options: "i" } },
                        { "processed_by.nama_admin": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.tag.hash_tag": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.tag": { $regex: searchQuery, $options: "i" } },
                        { "tags": { $regex: searchQuery, $options: "i" } },
                        { "processed_by": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.trackingId": { $regex: searchQuery, $options: "i" } }
                    ]
                }
            }] : []),
            ...(opdFilter ? [{
                $match: {
                    "tindakan.opd": { $in: [opdFilter] }
                }
            }] : []),
            ...(situasiFilter ? [{
                $match: {
                    "tindakan.situasi": situasiFilter
                }
            }] : []),
            ...(typeof req.query.is_pinned !== "undefined" ? [{
                $match: {
                    "is_pinned": req.query.is_pinned === "true"
                }
            }] : []),
            {
                $group: {
                    _id: "$tindakan.status",
                    count: { $sum: 1 }
                }
            }
        ];
        const summary = await Report.aggregate(basePipeline);
        const result = {};
        summary.forEach(item => {
            result[item._id || "Tanpa Status"] = item.count;
        });
        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error summary:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.get("/opd-list", async (req, res) => {
    try {
        const basePipeline = [
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            { $unwind: { path: "$tindakan", preserveNullAndEmptyArrays: false } },
            ...buildDynamicFilterPipeline(req.query),
            {
                $match: {
                    "tindakan.opd": { $exists: true, $type: "array", $not: { $size: 0 } }
                }
            },
            { $unwind: { path: "$tindakan.opd" } },
            {
                $match: {
                    "tindakan.opd": { $ne: null, $ne: "", $type: "string" }
                }
            },
            {
                $group: {
                    _id: "$tindakan.opd",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: { _id: 0, opd: "$_id", count: 1 }
            }
        ];

        const opdList = await Report.aggregate(basePipeline).allowDiskUse(true);
        const totalReports = opdList.reduce((acc, item) => acc + item.count, 0);
        res.status(200).json({
            total: totalReports,
            totalOPD: opdList.length,
            data: opdList
        });
    } catch (error) {
        console.error("❌ Error fetching OPD list:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.get("/situasi-list", async (req, res) => {
    try {
        const basePipeline = [
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            { $unwind: { path: "$tindakan", preserveNullAndEmptyArrays: true } },
            ...buildDynamicFilterPipeline(req.query),
            {
                $match: {
                    "tindakan.situasi": { $exists: true, $ne: null, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$tindakan.situasi",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: { _id: 0, situasi: "$_id", count: 1 }
            }
        ];

        const situasiList = await Report.aggregate(basePipeline);
        const totalReports = situasiList.reduce((acc, item) => acc + item.count, 0);
        res.status(200).json({
            total: totalReports,
            totalSituasi: situasiList.length,
            data: situasiList
        });
    } catch (error) {
        console.error("❌ Error fetching Situasi list:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.get("/dashboard-summary", async (req, res) => {
    try {
        const statusOrder = [
            "Perlu Verifikasi",
            "Verifikasi Situasi",
            "Verifikasi Kelengkapan Berkas",
            "Proses OPD Terkait",
            "Selesai Penanganan",
            "Selesai Pengaduan",
            "Ditutup"
        ];
        const searchQuery = req.query.search?.trim();
        const opdFilter = req.query.opd?.trim();
        const situasiFilter = req.query.situasi?.trim();
        const statusFilter = req.query.status?.trim();
        const isPinned = typeof req.query.is_pinned !== "undefined" ? req.query.is_pinned === "true" : undefined;

        // Pipeline dasar dengan filter dinamis
        const basePipeline = [
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "userlogins",
                    localField: "processed_by",
                    foreignField: "_id",
                    as: "processed_by"
                }
            },
            {
                $unwind: {
                    path: "$processed_by",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0]
                    },
                    statusScore: {
                        $indexOfArray: [statusOrder, "$tindakan.status"]
                    }
                }
            },
            ...(searchQuery ? [{
                $match: {
                    $or: [
                        { sessionId: { $regex: searchQuery, $options: "i" } },
                        { from: { $regex: searchQuery, $options: "i" } },
                        { "location.desa": { $regex: searchQuery, $options: "i" } },
                        { "location.kecamatan": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.opd": { $elemMatch: { $regex: searchQuery, $options: "i" } } },
                        { "user.name": { $regex: searchQuery, $options: "i" } },
                        { "processed_by.nama_admin": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.tag.hash_tag": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.tag": { $regex: searchQuery, $options: "i" } },
                        { "tags": { $regex: searchQuery, $options: "i" } },
                        { "processed_by": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.trackingId": { $regex: searchQuery, $options: "i" } }
                    ]
                }
            }] : []),
            ...(opdFilter ? [{
                $match: {
                    "tindakan.opd": { $in: [opdFilter] }
                }
            }] : []),
            ...(situasiFilter ? [{
                $match: {
                    "tindakan.situasi": situasiFilter
                }
            }] : []),
            ...(statusFilter ? [{
                $match: {
                    "tindakan.status": statusFilter
                }
            }] : []),
            ...(typeof isPinned === "boolean" ? [{
                $match: {
                    "is_pinned": isPinned
                }
            }] : [])
        ];

        // Pipeline breakdown status
        const statusBreakdownPipeline = [
            ...basePipeline,
            {
                $group: {
                    _id: "$tindakan.status",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ];

        // Pipeline breakdown OPD
        const opdBreakdownPipeline = [
            ...basePipeline,
            {
                $unwind: { path: "$tindakan.opd", preserveNullAndEmptyArrays: true }
            },
            {
                $group: {
                    _id: "$tindakan.opd",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ];

        // Pipeline breakdown situasi
        const situasiBreakdownPipeline = [
            ...basePipeline,
            {
                $group: {
                    _id: "$tindakan.situasi",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ];

        // Eksekusi paralel
        const [
            totalReports,
            statusBreakdown,
            opdBreakdown,
            situasiBreakdown
        ] = await Promise.all([
            Report.aggregate([...basePipeline, { $count: "total" }]),
            Report.aggregate(statusBreakdownPipeline),
            Report.aggregate(opdBreakdownPipeline),
            Report.aggregate(situasiBreakdownPipeline)
        ]);

        // Format breakdown agar { label: count }
        const statusResult = {};
        statusBreakdown.forEach(item => {
            if (item._id) statusResult[item._id] = item.count;
        });
        const opdResult = {};
        opdBreakdown.forEach(item => {
            if (item._id) opdResult[item._id] = item.count;
        });
        const situasiResult = {};
        situasiBreakdown.forEach(item => {
            if (item._id) situasiResult[item._id] = item.count;
        });

        res.status(200).json({
            summary: {
                totalReports: totalReports[0]?.total || 0,
                status: statusResult,
                opd: opdResult,
                situasi: situasiResult
            }
        });
    } catch (error) {
        console.error("❌ Error dashboard summary:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

/* -------- PINNED REPORTS -------- */
router.get("/pinned", async (req, res) => {
    try {
        const pinnedReports = await reportRepo.findAllPinned();
        if (!pinnedReports || pinnedReports.length === 0) {
            return res.status(404).json({ message: "Tidak ada laporan yang dipin" });
        }
        res.status(200).json(pinnedReports);
    } catch (error) {
        console.error("Error fetching pinned reports:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.get("/pinned/:sessionId", async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const report = await reportRepo.checkPinStatusBySessionId(sessionId);
        if (!report) {
            return res.status(404).json({ message: "Laporan dengan sessionId tersebut tidak ditemukan" });
        }
        if (!report.is_pinned) {
            return res.status(202).json({ message: "Laporan belum dipin" });
        }
        res.status(200).json(report);
    } catch (error) {
        console.error("Error fetching pinned report by sessionId:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

/* -------- TOGGLE PIN -------- */
router.put("/session/:sessionId/toggle-pin", async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const updatedReport = await reportRepo.togglePinnedBySessionId(sessionId);
        res.status(200).json({
            message: updatedReport.is_pinned ? "Laporan berhasil dipin" : "Laporan berhasil diunpin",
            report: updatedReport
        });
    } catch (error) {
        console.error("Error toggling pin status by sessionId:", error);
        if (error.message === 'Report not found') {
            return res.status(404).json({ message: "Laporan tidak ditemukan" });
        }
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.put("/:id/toggle-pin", async (req, res) => {
    try {
        const reportId = req.params.id;
        const updatedReport = await reportRepo.togglePinned(reportId);
        res.status(200).json({
            message: updatedReport.is_pinned ? "Laporan berhasil dipin" : "Laporan berhasil diunpin",
            report: updatedReport
        });
    } catch (error) {
        console.error("Error toggling pin status:", error);
        if (error.message === 'Report not found') {
            return res.status(404).json({ message: "Laporan tidak ditemukan" });
        }
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

/* --------- MAIN PAGINATED, FILTERED, SORTED LIST --------- */
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 500;
        const skip = (page - 1) * limit;
        const statusFilter = req.query.status;
        const searchQuery = req.query.search?.trim();
        const rawSorts = req.query.sorts;
        const opdFilter = req.query.opd?.trim();
        const situasiFilter = req.query.situasi?.trim();

        const statusOrder = [
            "Perlu Verifikasi",
            "Verifikasi Situasi",
            "Verifikasi Kelengkapan Berkas",
            "Proses OPD Terkait",
            "Selesai Penanganan",
            "Selesai Pengaduan",
            "Ditutup"
        ];

        let sortArray = [];
        try {
            sortArray = rawSorts ? JSON.parse(rawSorts) : [];
        } catch (err) {
            console.warn("Invalid sorts param:", err);
        }

        const sortObject = {};
        for (const { key, order } of sortArray) {
            const sortVal = order === "asc" ? 1 : -1;
            switch (key) {
                case "prioritas": sortObject["prioritasScore"] = sortVal; break;
                case "status": sortObject["statusScore"] = sortVal; break;
                case "situasi": sortObject["tindakan.situasi"] = sortVal; break;
                case "lokasi_kejadian": sortObject["location.desa"] = sortVal; break;
                case "opd": sortObject["tindakan.opd"] = sortVal; break;
                case "timer":
                case "date": sortObject["createdAt"] = sortVal; break;
                case "admin": sortObject["processed_by.nama_admin"] = sortVal; break;
                case "from": sortObject["from"] = sortVal; break;
                default: sortObject[key] = sortVal;
            }
        }
        if (Object.keys(sortObject).length === 0) {
            sortObject["prioritasScore"] = -1;
            sortObject["statusScore"] = 1;
            sortObject["createdAt"] = -1;
        }

        const basePipeline = [
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "userlogins",
                    localField: "processed_by",
                    foreignField: "_id",
                    as: "processed_by"
                }
            },
            {
                $unwind: {
                    path: "$processed_by",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0]
                    },
                    statusScore: {
                        $indexOfArray: [statusOrder, "$tindakan.status"]
                    }
                }
            },
            ...(searchQuery ? [{
                $match: {
                    $or: [
                        { sessionId: { $regex: searchQuery, $options: "i" } },
                        { from: { $regex: searchQuery, $options: "i" } },
                        { "location.desa": { $regex: searchQuery, $options: "i" } },
                        { "location.kecamatan": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.opd": { $elemMatch: { $regex: searchQuery, $options: "i" } } },
                        { "user.name": { $regex: searchQuery, $options: "i" } },
                        { "processed_by.nama_admin": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.tag.hash_tag": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.tag": { $regex: searchQuery, $options: "i" } },
                        { "tags": { $regex: searchQuery, $options: "i" } },
                        { "processed_by": { $regex: searchQuery, $options: "i" } }
                    ]
                }
            }] : []),
            ...(statusFilter ? [{
                $match: {
                    "tindakan.status": statusFilter
                }
            }] : []),
            ...(opdFilter ? [{
                $match: {
                    "tindakan.opd": { $in: [opdFilter] }
                }
            }] : []),
            ...(situasiFilter ? [{
                $match: {
                    "tindakan.situasi": situasiFilter
                }
            }] : []),
            ...(typeof req.query.is_pinned !== "undefined" ? [{
                $match: {
                    "is_pinned": req.query.is_pinned === "true"
                }
            }] : []),
            { $sort: sortObject },
        ];
        const pipeline = [
            ...basePipeline,
            { $skip: skip },
            { $limit: limit }
        ];
        const countPipeline = [
            ...basePipeline,
            { $count: "total" }
        ];
        const [reports, countResult] = await Promise.all([
            Report.aggregate(pipeline),
            Report.aggregate(countPipeline)
        ]);
        const totalReports = countResult[0]?.total || 0;
        res.status(200).json({
            page,
            limit,
            totalPages: Math.ceil(totalReports / limit),
            totalReports,
            data: reports
        });
    } catch (error) {
        console.error("❌ Error fetching reports:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.get("/new", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 500;
        const skip = (page - 1) * limit;
        const statusFilter = req.query.status;
        const searchQuery = req.query.search?.trim();
        const rawSorts = req.query.sorts;
        const opdFilter = req.query.opd?.trim();
        const situasiFilter = req.query.situasi?.trim();

        const statusOrder = [
            "Perlu Verifikasi",
            "Verifikasi Situasi",
            "Verifikasi Kelengkapan Berkas",
            "Proses OPD Terkait",
            "Selesai Penanganan",
            "Selesai Pengaduan",
            "Ditutup"
        ];

        let sortArray = [];
        try {
            sortArray = rawSorts ? JSON.parse(rawSorts) : [];
        } catch (err) {
            console.warn("Invalid sorts param:", err);
        }

        const sortObject = {};
        for (const { key, order } of sortArray) {
            const sortVal = order === "asc" ? 1 : -1;
            switch (key) {
                case "prioritas": sortObject["prioritasScore"] = sortVal; break;
                case "status": sortObject["statusScore"] = sortVal; break;
                case "situasi": sortObject["tindakan.situasi"] = sortVal; break;
                case "lokasi_kejadian": sortObject["location.desa"] = sortVal; break;
                case "opd": sortObject["tindakan.opd"] = sortVal; break;
                case "timer":
                case "date": sortObject["createdAt"] = sortVal; break;
                case "admin": sortObject["processed_by.nama_admin"] = sortVal; break;
                case "from": sortObject["from"] = sortVal; break;
                default: sortObject[key] = sortVal;
            }
        }
        if (Object.keys(sortObject).length === 0) {
            sortObject["prioritasScore"] = -1;
            sortObject["statusScore"] = 1;
            sortObject["createdAt"] = -1;
        }

        const basePipeline = [
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "userlogins",
                    localField: "processed_by",
                    foreignField: "_id",
                    as: "processed_by"
                }
            },
            {
                $unwind: {
                    path: "$processed_by",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0]
                    },
                    statusScore: {
                        $indexOfArray: [statusOrder, "$tindakan.status"]
                    }
                }
            },
            ...(searchQuery ? [{
                $match: {
                    $or: [
                        { sessionId: { $regex: searchQuery, $options: "i" } },
                        { from: { $regex: searchQuery, $options: "i" } },
                        { "location.desa": { $regex: searchQuery, $options: "i" } },
                        { "location.kecamatan": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.opd": { $elemMatch: { $regex: searchQuery, $options: "i" } } },
                        { "user.name": { $regex: searchQuery, $options: "i" } },
                        { "processed_by.nama_admin": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.tag.hash_tag": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.tag": { $regex: searchQuery, $options: "i" } },
                        { "tags": { $regex: searchQuery, $options: "i" } },
                        { "processed_by": { $regex: searchQuery, $options: "i" } }
                    ]
                }
            }] : []),
            ...(statusFilter ? [{
                $match: {
                    "tindakan.status": statusFilter
                }
            }] : []),
            ...(opdFilter ? [{
                $match: {
                    "tindakan.opd": { $in: [opdFilter] }
                }
            }] : []),
            ...(situasiFilter ? [{
                $match: {
                    "tindakan.situasi": situasiFilter
                }
            }] : []),
            ...(typeof req.query.is_pinned !== "undefined" ? [{
                $match: {
                    "is_pinned": req.query.is_pinned === "true"
                }
            }] : []),
        ];

        // Main pipeline for data
        const pipeline = [
            ...basePipeline,
            { $sort: sortObject },
            { $skip: skip },
            { $limit: limit }
        ];
        // Count pipeline
        const countPipeline = [
            ...basePipeline,
            { $count: "total" }
        ];

        // Breakdown pipelines (tanpa skip/limit/sort)
        const statusBreakdownPipeline = [
            ...basePipeline,
            {
                $group: {
                    _id: "$tindakan.status",
                    count: { $sum: 1 }
                }
            }
        ];
        const opdBreakdownPipeline = [
            ...basePipeline,
            { $unwind: { path: "$tindakan.opd", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$tindakan.opd",
                    count: { $sum: 1 }
                }
            }
        ];
        const situasiBreakdownPipeline = [
            ...basePipeline,
            {
                $group: {
                    _id: "$tindakan.situasi",
                    count: { $sum: 1 }
                }
            }
        ];

        // Parallel fetch
        const [
            reports,
            countResult,
            statusBreakdown,
            opdBreakdown,
            situasiBreakdown
        ] = await Promise.all([
            Report.aggregate(pipeline),
            Report.aggregate(countPipeline),
            Report.aggregate(statusBreakdownPipeline),
            Report.aggregate(opdBreakdownPipeline),
            Report.aggregate(situasiBreakdownPipeline)
        ]);
        const totalReports = countResult[0]?.total || 0;

        // Format breakdown
        const statusResult = {};
        statusBreakdown.forEach(item => {
            if (item._id) statusResult[item._id] = item.count;
        });
        const opdResult = {};
        opdBreakdown.forEach(item => {
            if (item._id) opdResult[item._id] = item.count;
        });
        const situasiResult = {};
        situasiBreakdown.forEach(item => {
            if (item._id) situasiResult[item._id] = item.count;
        });

        res.status(200).json({
            page,
            limit,
            totalPages: Math.ceil(totalReports / limit),
            totalReports,
            data: reports,
            summary: {
                status: statusResult,
                opd: opdResult,
                situasi: situasiResult
            }
        });
    } catch (error) {
        console.error("❌ Error fetching reports:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

/* ----------- CRUD SPESIFIK BERDASARKAN SESSIONID ------------- */
// Get by sessionId
router.get("/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    try {
        const report = await reportRepo.findBySessionId(sessionId);
        if (!report) {
            return res.status(404).json({ message: "Laporan tidak ditemukan" });
        }
        res.status(200).json(report);
    } catch (error) {
        console.error("Error fetching report by sessionId:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// Update by sessionId
router.put("/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    const { name, jenis_kelamin, message, location } = req.body;
    try {
        const report = await reportRepo.findBySessionId(sessionId);
        if (!report) {
            return res.status(404).json({ message: "Laporan tidak ditemukan" });
        }
        const user = report.user;
        const updatesUser = { name, jenis_kelamin };
        let userChanged = false;
        for (const key in updatesUser) {
            if (updatesUser[key] !== undefined) {
                user[key] = updatesUser[key];
                userChanged = true;
            }
        }
        if (userChanged) await user.save();
        let reportChanged = false;
        if (typeof message === "string") {
            report.message = message;
            reportChanged = true;
        }
        if (location?.description) {
            report.location ??= {};
            report.location.description = location.description;
            reportChanged = true;
        }
        if (reportChanged) await report.save();
        const updatedReport = await reportRepo.findBySessionId(sessionId);
        res.status(200).json({ message: "Laporan berhasil diperbarui", report: updatedReport });
    } catch (error) {
        console.error("Error updating report by sessionId:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

/* ----------- DELETE MULTIPLE BY SESSIONIDS ------------- */
router.delete("/", async (req, res) => {
    const { sessionIds } = req.body;
    if (!Array.isArray(sessionIds)) {
        return res.status(400).json({ error: "sessionIds harus array" });
    }
    try {
        const result = await reportRepo.deleteManyBySessionIds(sessionIds);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

// Helper function to build dynamic filter pipeline
function buildDynamicFilterPipeline(query) {
    const statusOrder = [
        "Perlu Verifikasi",
        "Verifikasi Situasi",
        "Verifikasi Kelengkapan Berkas",
        "Proses OPD Terkait",
        "Selesai Penanganan",
        "Selesai Pengaduan",
        "Ditutup"
    ];
    const searchQuery = query.search?.trim();
    const opdFilter = query.opd?.trim();
    const situasiFilter = query.situasi?.trim();
    const statusFilter = query.status?.trim();
    const isPinned = typeof query.is_pinned !== "undefined" ? query.is_pinned === "true" : undefined;

    let filters = [];
    if (searchQuery) {
        filters.push({
            $or: [
                { sessionId: { $regex: searchQuery, $options: "i" } },
                { from: { $regex: searchQuery, $options: "i" } },
                { "location.desa": { $regex: searchQuery, $options: "i" } },
                { "location.kecamatan": { $regex: searchQuery, $options: "i" } },
                { "tindakan.opd": { $elemMatch: { $regex: searchQuery, $options: "i" } } },
                { "user.name": { $regex: searchQuery, $options: "i" } },
                { "processed_by.nama_admin": { $regex: searchQuery, $options: "i" } },
                { "tindakan.tag.hash_tag": { $regex: searchQuery, $options: "i" } },
                { "tindakan.tag": { $regex: searchQuery, $options: "i" } },
                { "tags": { $regex: searchQuery, $options: "i" } },
                { "processed_by": { $regex: searchQuery, $options: "i" } },
                { "tindakan.trackingId": { $regex: searchQuery, $options: "i" } }
            ]
        });
    }
    if (opdFilter) {
        filters.push({ "tindakan.opd": { $in: [opdFilter] } });
    }
    if (situasiFilter) {
        filters.push({ "tindakan.situasi": situasiFilter });
    }
    if (statusFilter && statusFilter !== "Semua Status") {
        filters.push({ "tindakan.status": statusFilter });
    }
    if (typeof isPinned !== "undefined") {
        filters.push({ is_pinned: isPinned });
    }
    return filters.length > 0 ? [{ $match: { $and: filters } }] : [];
}