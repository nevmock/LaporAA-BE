const express = require("express");
const router = express.Router();
const userProfileRepo = require("../repositories/userProfileRepo");
const UserSession = require("../models/UserSession");
const Report = require("../models/Report");

// Update forceModeManual
router.patch('/session/force-mode/:from', async (req, res) => {
    try {
        const { force } = req.body; // boolean
        const { from } = req.params;

        const session = await UserSession.findOneAndUpdate(
            { from },
            {
                forceModeManual: force,
                mode: force ? 'manual' : 'bot', // optional: langsung set mode
                manualModeUntil: force ? null : new Date(), // clear timer
            },
            { new: true }
        );

        if (!session) return res.status(404).json({ message: "Session not found" });

        res.json({ message: "Mode updated", session });
    } catch (err) {
        res.status(500).json({ message: "Failed to update mode", error: err.message });
    }
});

// PATCH /user-mode/:from
router.patch("/user-mode/:from", async (req, res) => {
    const { from } = req.params;
    const { mode } = req.body;

    if (!["bot", "manual"].includes(mode)) {
        return res.status(400).json({ error: "Mode harus 'bot' atau 'manual'" });
    }

    try {
        const session = await UserSession.findOneAndUpdate(
            { from, status: "in_progress" },
            { mode },
            { new: true, upsert: true }
        );

        res.json({
            message: `Mode untuk ${from} diubah menjadi '${mode}'`,
            session,
        });
    } catch (err) {
        console.error("❌ Gagal update mode:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /user-mode/:from
router.get("/user-mode/:from", async (req, res) => {
    const { from } = req.params;

    try {
        const session = await UserSession.findOne({ from, status: "in_progress" });

        if (!session) {
            return res.status(404).json({ error: "Session tidak ditemukan" });
        }

        res.json({ mode: session.mode });
    } catch (err) {
        res.status(500).json({ error: "Gagal mengambil mode user" });
    }
});

// DELETE /user/:from → hapus seluruh data user
router.delete("/user/:from", async (req, res) => {
    try {
        const { from } = req.params;
        const result = await userProfileRepo.deleteUserByFrom(from);
        res.json(result);
    } catch (err) {
        console.error("❌ Gagal hapus user:", err);
        res.status(500).json({ error: err.message });
    }
});

// routes/publicReportRoutes.js
router.get('/public-reports/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const report = await Report.findOne({ sessionId }).populate('user');
        if (!report) return res.status(404).json({ error: 'Not found' });

        // Hanya return data yang diperlukan
        return res.json({
            user: {
                name: report.user?.name || 'Warga'
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;