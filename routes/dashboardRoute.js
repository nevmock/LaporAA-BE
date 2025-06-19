const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");
const Report = require("../models/Report");
const Tindakan = require("../models/Tindakan");
dayjs.extend(isoWeek);

router.get("/efisiensi", dashboardController.getEfisiensi);
router.get("/effectiveness", dashboardController.getEffectiveness);
router.get("/distribusi", dashboardController.getDistribusi);
router.get("/kepuasan", dashboardController.getKepuasan);
router.get('/harian', dashboardController.getDailyReportCount);
router.get('/wilayah-summary', dashboardController.getWilayahSummary);
router.get('/status-summary', dashboardController.getStatusSummary);

router.get("/perangkat-daerah-summary", async (req, res) => {
    try {
        const { mode = "monthly", year, month, week } = req.query;

        if (!year) {
            return res.status(400).json({ message: "Parameter 'year' diperlukan" });
        }

        let startDate, endDate;

        if (mode === "yearly") {
            startDate = dayjs(`${year}-01-01`).startOf("day").toDate();
            endDate = dayjs(`${year}-12-31`).endOf("day").toDate();
        } else if (mode === "monthly") {
            if (!month) return res.status(400).json({ message: "Parameter 'month' diperlukan" });
            startDate = dayjs(`${year}-${month}-01`).startOf("month").toDate();
            endDate = dayjs(`${year}-${month}-01`).endOf("month").toDate();
        } else if (mode === "weekly") {
            if (!month || !week) {
                return res.status(400).json({ message: "Parameter 'month' dan 'week' diperlukan untuk mode 'weekly'" });
            }

            const firstDayOfMonth = dayjs(`${year}-${month}-01`);
            let startOfWeek = firstDayOfMonth.startOf('week').add(1, 'day'); // Mulai dari Senin
            for (let i = 1; i < week; i++) {
                startOfWeek = startOfWeek.add(1, 'week');
            }

            startDate = startOfWeek.startOf("day").toDate();
            endDate = startOfWeek.endOf("week").endOf("day").toDate();
        } else {
            return res.status(400).json({ message: "Mode tidak valid" });
        }

        const data = await Tindakan.aggregate([
            {
                $match: {
                    status: { $in: ["Proses OPD Terkait", "Selesai Penanganan", "Selesai Pengaduan"] },
                    opd: { $ne: "" },
                    createdAt: { $gte: startDate, $lte: endDate }
                }

            },
            {
                $group: {
                    _id: "$opd",
                    total: { $sum: 1 }
                }
            },
            {
                $sort: { total: -1 }
            }
        ]);

        const result = {};
        data.forEach(d => {
            result[d._id] = d.total;
        });

        return res.json(result);
    } catch (err) {
        console.error("Error fetching opd summary:", err);
        return res.status(500).json({ message: "Terjadi kesalahan" });
    }
});

router.get("/map", async (req, res) => {
    try {
        const { mode = "monthly", year, month, week, status } = req.query;

        const matchStage = {
            createdAt: {},
        };

        const now = new Date();
        const inputYear = parseInt(year) || now.getFullYear();
        const inputMonth = parseInt(month) || now.getMonth() + 1;
        const inputWeek = parseInt(week) || 1;

        const startOf = (unit) => {
            if (unit === "month") return new Date(inputYear, inputMonth - 1, 1);
            if (unit === "year") return new Date(inputYear, 0, 1);
            return new Date(); // fallback
        };

        const endOf = (unit) => {
            if (unit === "month") return new Date(inputYear, inputMonth, 0, 23, 59, 59);
            if (unit === "year") return new Date(inputYear, 11, 31, 23, 59, 59);
            return new Date(); // fallback
        };

        // Tentukan range tanggal berdasarkan mode
        if (mode === "yearly") {
            matchStage.createdAt = {
                $gte: startOf("year"),
                $lte: endOf("year"),
            };
        } else if (mode === "monthly") {
            matchStage.createdAt = {
                $gte: startOf("month"),
                $lte: endOf("month"),
            };
        } else if (mode === "weekly") {
            const firstOfMonth = new Date(inputYear, inputMonth - 1, 1);
            const firstWeekday = firstOfMonth.getDay() === 0 ? 1 : 0; // start on Monday
            const start = new Date(inputYear, inputMonth - 1, 1 - firstWeekday + 7 * (inputWeek - 1));
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59);
            matchStage.createdAt = { $gte: start, $lte: end };
        }

        const basePipeline = [
            { $match: matchStage },

            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan",
                },
            },
            {
                $unwind: {
                    path: "$tindakan",
                    preserveNullAndEmptyArrays: true,
                },
            },

            ...(status && status !== "Semua"
                ? [
                    {
                        $match: {
                            "tindakan.status": status,
                        },
                    },
                ]
                : []),

            {
                $addFields: {
                    prioritasScore: {
                        $cond: [{ $eq: ["$tindakan.prioritas", "Ya"] }, 1, 0],
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
                                "Ditutup",
                            ],
                            "$tindakan.status",
                        ],
                    },
                },
            },
            {
                $sort: {
                    prioritasScore: -1,
                    statusScore: 1,
                    createdAt: -1,
                },
            },
        ];

        const reports = await Report.aggregate(basePipeline);
        const populatedReports = await Report.populate(reports, { path: "user" });

        res.status(200).json({
            totalReports: populatedReports.length,
            data: populatedReports,
        });
    } catch (error) {
        console.error("❌ Error fetching reports:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.get("/summary-dashboard", async (req, res) => {
    try {
        const { mode = "monthly", year, month, week } = req.query;

        let matchStage = {};
        // Mode ALL
        if (mode === "all") {
            // Tidak ada filter tanggal
        } else {
            if (!year) {
                return res.status(400).json({ message: "Parameter 'year' diperlukan" });
            }

            let startDate, endDate;
            if (mode === "yearly") {
                startDate = dayjs(`${year}-01-01`).startOf("day").toDate();
                endDate = dayjs(`${year}-12-31`).endOf("day").toDate();
            } else if (mode === "monthly") {
                if (!month) return res.status(400).json({ message: "Parameter 'month' diperlukan" });
                startDate = dayjs(`${year}-${month}-01`).startOf("month").toDate();
                endDate = dayjs(`${year}-${month}-01`).endOf("month").toDate();
            } else if (mode === "weekly") {
                if (!month || !week) {
                    return res.status(400).json({ message: "Parameter 'month' dan 'week' diperlukan untuk mode 'weekly'" });
                }
                const firstDayOfMonth = dayjs(`${year}-${month}-01`);
                let startOfWeek = firstDayOfMonth.startOf('week').add(1, 'day'); // Senin
                for (let i = 1; i < week; i++) {
                    startOfWeek = startOfWeek.add(1, 'week');
                }
                startDate = startOfWeek.startOf("day").toDate();
                endDate = startOfWeek.endOf("week").endOf("day").toDate();
            } else {
                return res.status(400).json({ message: "Mode tidak valid" });
            }

            matchStage = { "tindakan.createdAt": { $gte: startDate, $lte: endDate } };
        }

        const pipeline = [
            {
                $lookup: {
                    from: "tindakans",
                    localField: "tindakan",
                    foreignField: "_id",
                    as: "tindakan"
                }
            },
            { $unwind: { path: "$tindakan", preserveNullAndEmptyArrays: true } },
        ];
        if (mode !== "all") {
            pipeline.push({ $match: matchStage });
        }
        pipeline.push({
            $group: {
                _id: "$tindakan.status",
                count: { $sum: 1 }
            }
        });

        const summary = await Report.aggregate(pipeline);

        const result = {};
        summary.forEach(item => {
            result[item._id || "Tanpa Status"] = item.count;
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("❌ Error summary-dashboard:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

module.exports = router;
