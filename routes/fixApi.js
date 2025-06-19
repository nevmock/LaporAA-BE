const express = require("express");
const router = express.Router();
const Tindakan = require("../models/Tindakan");

router.patch("/fix-ditolak", async (req, res) => {
    try {
        const now = new Date();

        const updateStatusResult = await Tindakan.updateMany(
            { status: "Ditolak" },
            { $set: { status: "Ditutup", updatedAt: now } }
        );

        const updateFeedbackResult = await Tindakan.updateMany(
            { feedbackStatus: "Selesai Ditolak" },
            { $set: { feedbackStatus: "Selesai Ditutup", updatedAt: now } }
        );

        res.json({
            message: "✅ Semua data berhasil diperbarui.",
            updatedStatusCount: updateStatusResult.modifiedCount,
            updatedFeedbackStatusCount: updateFeedbackResult.modifiedCount,
        });
    } catch (error) {
        console.error("❌ Gagal update tindakan:", error);
        res.status(500).json({ error: "Gagal update data tindakan" });
    }
});

module.exports = router;
