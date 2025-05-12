const efisiensiService = require("../services/efisiensiService");
const effectivenessService = require("../services/effectivenessService");
const distribusiService = require("../services/distribusiService");
const kepuasanService = require("../services/kepuasanService");
const Report = require('../models/Report');

async function getEfisiensi(req, res) {
    try {
        const result = await efisiensiService.calculateEfisiensi();
        res.json(result);
    } catch (error) {
        console.error("Error calculating efisiensi:", error);
        res.status(500).json({ value: 0, updated_at: null });
    }
}

async function getEffectiveness(req, res) {
    try {
        const result = await effectivenessService.calculateEffectiveness();
        res.json(result);
    } catch (error) {
        console.error("Error calculating effectiveness:", error);
        res.status(500).json({ value: 0, updated_at: null });
    }
}

async function getDistribusi(req, res) {
    try {
        const result = await distribusiService.calculateDistribusi();
        res.json(result);
    } catch (error) {
        console.error("Error calculating distribusi solusi:", error);
        res.status(500).json({ value: 0, updated_at: null });
    }
}

async function getKepuasan(req, res) {
    try {
        const result = await kepuasanService.calculateKepuasan();
        res.json(result);
    } catch (error) {
        console.error("Error calculating kepuasan solusi:", error);
        res.status(500).json({ value: 0, updated_at: null });
    }
}

async function getDailyReportCount (req, res) {
    try {
        const result = await Report.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    total: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(result.map(item => ({
            date: item._id,
            total: item.total
        })));
    } catch (err) {
        res.status(500).json({ message: 'Gagal mengambil data harian' });
    }
};


module.exports = {
    getEfisiensi,
    getEffectiveness,
    getDistribusi,
    getKepuasan,
    getDailyReportCount
};
