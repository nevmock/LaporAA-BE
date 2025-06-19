const express = require("express");
const router = express.Router();
const reportRepo = require("../repositories/reportRepo");
const Report = require("../models/Report");

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
                        { "tindakan.opd": { $regex: searchQuery, $options: "i" } },
                        { "user.name": { $regex: searchQuery, $options: "i" } },
                    ]
                }
            }] : []),
            ...(statusFilter && statusFilter !== "Semua" ? [{
                $match: {
                    "tindakan.status": statusFilter
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

module.exports = router;