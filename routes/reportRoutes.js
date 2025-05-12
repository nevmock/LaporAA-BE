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

const STATUS_ORDER = [
    "Perlu Verifikasi",
    "Verifikasi Situasi",
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditolak"
];

router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Hitung total dokumen
        const totalReports = await Report.countDocuments();

        // Query data + populate manual karena aggregate tidak bisa pakai .populate()
        const reports = await Report.aggregate([
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
                $addFields: {
                    prioritasScore: { $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0] },
                    statusScore: {
                        $indexOfArray: [STATUS_ORDER, "$tindakan.status"]
                    }
                }
            },
            {
                $sort: {
                    prioritasScore: -1,
                    statusScore: 1,
                    createdAt: -1
                }
            },
            { $skip: skip },
            { $limit: limit }
        ]);

        // Populate user secara manual (karena aggregate tidak bisa populate user langsung)
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

module.exports = router;