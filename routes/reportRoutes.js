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
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const statusFilter = req.query.status;

        const matchStage = [];

        // Filter hanya jika status dikirim dan bukan 'Semua'
        if (statusFilter && statusFilter !== "Semua") {
            matchStage.push({
                $match: {
                    "tindakan.status": statusFilter
                }
            });
        }

        // Pipeline dasar
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
            ...matchStage,
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
            }
        ];

        // Hitung total sesuai filter
        const countResult = await Report.aggregate([...basePipeline, { $count: "total" }]);
        const totalReports = countResult[0]?.total || 0;

        // Tambahkan pagination dan sorting ke pipeline utama
        const paginatedPipeline = [
            ...basePipeline,
            {
                $sort: {
                    prioritasScore: -1,
                    statusScore: 1,
                    createdAt: -1
                }
            },
            { $skip: skip },
            { $limit: limit }
        ];

        const reports = await Report.aggregate(paginatedPipeline);

        // Populate user (manual karena aggregate tidak support populate langsung)
        const populatedReports = await Report.populate(reports, { path: "user" });

        res.status(200).json({
            page,
            limit,
            totalPages: Math.ceil(totalReports / limit),
            totalReports,
            data: populatedReports
        });
    } catch (error) {
        console.error("❌ Error fetching reports:", error);
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
    const { message, location } = req.body;

    try {
        const report = await Report.findOne({ sessionId });

        if (!report) {
            return res.status(404).json({ message: "Laporan tidak ditemukan" });
        }

        if (message !== undefined) {
            report.message = message;
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

module.exports = router;