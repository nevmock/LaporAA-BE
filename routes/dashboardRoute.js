const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const dayjs = require("dayjs");
const isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);

const Tindakan = require("../models/Tindakan");

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
                    status: "Selesai Penanganan",
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

module.exports = router;
