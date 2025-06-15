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

        const statusOrder = [
            "Perlu Verifikasi",
            "Verifikasi Situasi",
            "Verifikasi Kelengkapan Berkas",
            "Proses OPD Terkait",
            "Selesai Penanganan",
            "Selesai Pengaduan",
            "Ditolak"
        ];

        const pipeline = [
            // JOIN ke UserProfile
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

            // JOIN ke Tindakan
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

            // Filter pencarian (jika ada)
            ...(searchQuery
                ? [{
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
                }]
                : []),

            // Filter status (jika bukan "Semua")
            ...(statusFilter && statusFilter !== "Semua"
                ? [{
                    $match: {
                        "tindakan.status": statusFilter
                    }
                }]
                : []),

            // Tambahkan skor prioritas dan urutan status
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

            // Urutkan
            { $sort: { prioritasScore: -1, statusScore: 1, createdAt: -1 } },

            // Paginate
            { $skip: skip },
            { $limit: limit }
        ];

        // Pipeline untuk total count (tanpa skip & limit)
        const countPipeline = pipeline.filter(stage =>
            !("$skip" in stage) && !("$limit" in stage)
        ).concat({ $count: "total" });

        // Eksekusi query
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
                                "Ditolak"
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

// PUT update report by sessionId
router.put("/:sessionId", async (req, res) => {
    const { sessionId } = req.params;
    const { name, jenis_kelamin, message, location } = req.body;

    try {
        const report = await reportRepo.findBySessionId(sessionId);

        if (!report) {
            return res.status(404).json({ message: "Laporan tidak ditemukan" });
        }

        if (message !== undefined) {
            report.message = message;
        }

        if (name !== undefined) {
            report.user.name = name;
        }

        if (jenis_kelamin !== undefined) {
            report.user.jenis_kelamin = jenis_kelamin;
        }

        if (location && typeof location.description === "string") {
            if (!report.location) {
                report.location = {};
            }
            report.location.description = location.description;
        }

        await report.save();

        res.status(200).json({ message: "Laporan berhasil diperbarui", report });
    } catch (error) {
        console.error("Error updating report by sessionId:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const result = await reportController.deleteById(req.params.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

module.exports = router;