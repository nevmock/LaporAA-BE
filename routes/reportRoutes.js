const express = require("express");
const router = express.Router();
const reportRepo = require("../repositories/reportRepo");
const Report = require("../models/Report");
const Tindakan = require("../models/Tindakan");

// GET all reports
// router.get("/", async (req, res) => {
//     try {
//         const reports = await reportRepo.findAll();

//         if (!reports || reports.length === 0) {
//             return res.status(404).json({ message: "Tidak ada laporan yang ditemukan" });
//         }

//         res.status(200).json(reports);
//     } catch (error) {
//         console.error("Error fetching reports:", error);
//         res.status(500).json({ message: "Terjadi kesalahan pada server" });
//     }
// });

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

        // Parse sort
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
                case "prioritas":
                    sortObject["prioritasScore"] = sortVal;
                    break;
                case "status":
                    sortObject["statusScore"] = sortVal;
                    break;
                case "situasi":
                    sortObject["tindakan.situasi"] = sortVal;
                    break;
                case "lokasi_kejadian":
                    sortObject["location.desa"] = sortVal;
                    break;
                case "opd":
                    sortObject["tindakan.opd"] = sortVal;
                    break;
                case "timer":
                case "date":
                    sortObject["createdAt"] = sortVal;
                    break;
                case "admin":
                    sortObject["processed_by.nama_admin"] = sortVal;
                    break;
                case "from":
                    sortObject["from"] = sortVal;
                    break;
                default:
                    sortObject[key] = sortVal;
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
                        { "tindakan.tag": { $regex: searchQuery, $options: "i" } }, // optional: string tag in array
                        { "tags": { $regex: searchQuery, $options: "i" } },
                        { "processed_by": { $regex: searchQuery, $options: "i" } }, // optional: legacy root-level tags
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

        // Populate user
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

        // Ubah ke format { status: jumlah }
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

// /reports/summary
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

        // Ambil filter selain status
        const searchQuery = req.query.search?.trim();
        const opd = req.query.opd?.trim();
        const kecamatan = req.query.kecamatan?.trim();
        const desa = req.query.desa?.trim();

        // Pipeline mirip data utama, TAPI **TIDAK ADA filter status**
        const basePipeline = [
            {
                $lookup: {
                    from: "userprofiles",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            { $unwind: { path: "$tindakan", preserveNullAndEmptyArrays: true } },

            ...(searchQuery ? [{
                $match: {
                    $or: [
                        { sessionId: { $regex: searchQuery, $options: "i" } },
                        { from: { $regex: searchQuery, $options: "i" } },
                        { "location.desa": { $regex: searchQuery, $options: "i" } },
                        { "location.kecamatan": { $regex: searchQuery, $options: "i" } },
                        { "tindakan.opd": { $elemMatch: { $regex: searchQuery, $options: "i" } } },
                        { "user.name": { $regex: searchQuery, $options: "i" } },
                    ]
                }
            }] : []),
            ...(opd ? [{ $match: { "tindakan.opd": { $in: [opd] } } }] : []),
            ...(kecamatan ? [{ $match: { "location.kecamatan": kecamatan } }] : []),
            ...(desa ? [{ $match: { "location.desa": desa } }] : []),

            {
                $group: {
                    _id: "$tindakan.status",
                    count: { $sum: 1 }
                }
            }
        ];

        const summary = await Report.aggregate(basePipeline);

        // Format jadi { status: count }
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

// GET list of all unique OPD
router.get("/opd-list", async (req, res) => {
    try {
        // Pipeline untuk mendapatkan daftar OPD dengan count masing-masing
        const opdList = await Report.aggregate([
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            { $unwind: { path: "$tindakan", preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    "tindakan.opd": { $exists: true, $type: "array", $not: { $size: 0 } }
                }
            },
            // Unwind the opd array to handle multiple OPDs per report
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
            {
                $sort: { _id: 1 }  // Sort alphabetically
            },
            {
                $project: {
                    _id: 0,
                    opd: "$_id",
                    count: 1
                }
            }
        ]).allowDiskUse(true); // Allow disk usage for large datasets

        // Pipeline terpisah untuk menghitung total laporan yang memiliki OPD
        const totalReportsWithOPD = await Report.aggregate([
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            { $unwind: { path: "$tindakan", preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    "tindakan.opd": { $exists: true, $type: "array", $not: { $size: 0 } }
                }
            },
            {
                $count: "total"
            }
        ]);

        const totalReports = totalReportsWithOPD[0]?.total || 0;

        res.status(200).json({
            total: totalReports, // Total laporan yang memiliki OPD
            totalOPD: opdList.length, // Jumlah OPD unik
            data: opdList
        });
    } catch (error) {
        console.error("❌ Error fetching OPD list:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// GET simple test endpoint
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

// GET list of all unique Situasi
router.get("/situasi-list", async (req, res) => {
    try {
        const situasiList = await Report.aggregate([
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
            {
                $sort: { _id: 1 }  // Sort alphabetically
            },
            {
                $project: {
                    _id: 0,
                    situasi: "$_id",
                    count: 1
                }
            }
        ]);

        // Pipeline terpisah untuk menghitung total laporan yang memiliki situasi
        const totalReportsWithSituasi = await Report.aggregate([
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
                $match: {
                    "tindakan.situasi": { $exists: true, $ne: null, $ne: "" }
                }
            },
            {
                $count: "total"
            }
        ]);

        const totalReports = totalReportsWithSituasi[0]?.total || 0;

        res.status(200).json({
            total: totalReports, // Total laporan yang memiliki situasi
            totalSituasi: situasiList.length, // Jumlah situasi unik
            data: situasiList
        });
    } catch (error) {
        console.error("❌ Error fetching Situasi list:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// GET report by sessionId
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

// GET all pinned reports
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

// GET pinned report by sessionId
router.get("/pinned/:sessionId", async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        // First check if the report exists at all, regardless of pin status
        const report = await reportRepo.checkPinStatusBySessionId(sessionId);

        if (!report) {
            // Report doesn't exist at all
            return res.status(404).json({ message: "Laporan dengan sessionId tersebut tidak ditemukan" });
        }

        if (!report.is_pinned) {
            // Report exists but isn't pinned
            return res.status(202).json({
                message: "Laporan belum dipin",
                // report: report 
            });
        }

        // Report exists and is pinned
        res.status(200).json(report);
    } catch (error) {
        console.error("Error fetching pinned report by sessionId:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// Toggle pin status of a report by ID (keeping for backward compatibility)
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

// Toggle pin status of a report by sessionId
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

module.exports = router;