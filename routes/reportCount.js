const express = require("express");
const router = express.Router();

const Report = require("../models/Report");

// GET
router.get("/", async (req, res) => {
    const status = "Perlu Verifikasi";

    try {
        // Cari semua report, populate tindakan[0] aja
        const reports = await Report.find()
            .populate("user")
            .populate({
                path: "tindakan",
                model: "Tindakan"
            })

        // Filter hanya yang tindakan[0] status-nya sesuai
        const filtered = reports.filter(r =>
            r.tindakan?.status === status
        );

        res.status(200).json({ count: filtered.length });
    } catch (err) {
        console.error("❌ Gagal hitung laporan (tindakan[0]):", err);
        res.status(500).json({ message: "Terjadi kesalahan saat menghitung laporan." });
    }
});

module.exports = router;