const express = require("express");
const router = express.Router();
const reportRepo = require("../repositories/reportRepo");

// GET all reports
router.get("/", async (req, res) => {
    try {
        const reports = await reportRepo.findAll();

        if (!reports || reports.length === 0) {
            return res.status(404).json({ message: "Tidak ada laporan yang ditemukan" });
        }

        res.status(200).json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
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