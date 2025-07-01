const express = require("express");
const router = express.Router();
const userProfileRepo = require("../repositories/userProfileRepo");
const UserSession = require("../models/UserSession");
const Report = require("../models/Report");

// Toggle forceModeManual (saklar utama)
router.patch('/session/force-mode/:from', async (req, res) => {
    try {
        const { force } = req.body; // boolean
        const { from } = req.params;

        if (typeof force !== 'boolean') {
            return res.status(400).json({ 
                error: "Parameter 'force' harus berupa boolean (true/false)" 
            });
        }

        let session = await UserSession.findOne({ from });
        if (!session) {
            // Buat session baru jika belum ada
            session = await UserSession.create({
                from,
                currentAction: null,
                step: "MAIN_MENU",
                data: {},
                forceModeManual: force,
                mode: force ? 'manual' : 'bot',
                manualModeUntil: null
            });
        } else {
            // Update session yang sudah ada
            session.forceModeManual = force;
            
            if (force) {
                // Jika forceModeManual diaktifkan, set mode ke manual dan clear timeout
                session.mode = 'manual';
                session.manualModeUntil = null;
            } else {
                // Jika forceModeManual dimatikan, mode bisa dikembalikan ke bot
                // Kecuali jika masih ada manual mode timeout yang aktif
                if (!session.manualModeUntil || new Date() > session.manualModeUntil) {
                    session.mode = 'bot';
                    session.manualModeUntil = null;
                }
            }
            
            await session.save();
        }

        const effectiveMode = session.getEffectiveMode();
        
        res.json({ 
            message: `Force mode manual ${force ? 'diaktifkan' : 'dinonaktifkan'} untuk ${from}`,
            session: {
                from: session.from,
                forceModeManual: session.forceModeManual,
                mode: session.mode,
                effectiveMode: effectiveMode,
                manualModeUntil: session.manualModeUntil
            }
        });
    } catch (err) {
        console.error("❌ Error updating force mode:", err);
        res.status(500).json({ message: "Failed to update force mode", error: err.message });
    }
});

// GET force mode status
router.get('/session/force-mode/:from', async (req, res) => {
    try {
        const { from } = req.params;

        let session = await UserSession.findOne({ from });
        if (!session) {
            return res.status(404).json({ 
                error: "Session tidak ditemukan",
                suggestion: "Session akan dibuat otomatis saat user mengirim pesan pertama"
            });
        }

        const effectiveMode = session.getEffectiveMode();
        
        res.json({
            from: session.from,
            forceModeManual: session.forceModeManual,
            mode: session.mode,
            effectiveMode: effectiveMode,
            manualModeUntil: session.manualModeUntil,
            isManualModeExpired: session.manualModeUntil ? new Date() > session.manualModeUntil : null
        });
    } catch (err) {
        console.error("❌ Error getting force mode status:", err);
        res.status(500).json({ error: "Failed to get force mode status", details: err.message });
    }
});

// Test endpoint untuk aktivasi manual mode dengan timeout (untuk testing)
router.post('/session/activate-manual-mode/:from', async (req, res) => {
    try {
        const { from } = req.params;
        const { minutes = 1 } = req.body;

        let session = await UserSession.findOne({ from });
        if (!session) {
            session = await UserSession.create({
                from,
                currentAction: null,
                step: "MAIN_MENU",
                data: {},
            });
        }

        await session.activateManualMode(minutes);
        const effectiveMode = session.getEffectiveMode();

        res.json({
            message: `Manual mode diaktifkan untuk ${minutes} menit`,
            session: {
                from: session.from,
                mode: session.mode,
                effectiveMode: effectiveMode,
                manualModeUntil: session.manualModeUntil,
                forceModeManual: session.forceModeManual
            }
        });
    } catch (err) {
        console.error("❌ Error activating manual mode:", err);
        res.status(500).json({ error: "Failed to activate manual mode", details: err.message });
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