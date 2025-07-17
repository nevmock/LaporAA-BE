const express = require("express");
const router = express.Router();
const modeManager = require("../services/modeManager");

/**
 * Mode Management Routes
 * Endpoint terpusat untuk pengelolaan semua mode user
 */

// =========================
// FORCE MODE (Saklar Utama)
// =========================

/**
 * Toggle Force Mode Manual
 * POST /mode/force/:from
 * Body: { "force": true/false }
 */
router.post('/force/:from', async (req, res) => {
    try {
        const { from } = req.params;
        const { force } = req.body;

        if (typeof force !== 'boolean') {
            return res.status(400).json({
                error: "Parameter 'force' harus berupa boolean (true/false)"
            });
        }

        const result = await modeManager.setForceMode(from, force);

        res.json({
            message: `Force mode ${force ? 'diaktifkan' : 'dinonaktifkan'} untuk ${from}`,
            ...result
        });
    } catch (err) {
        console.error("❌ Error setting force mode:", err);
        res.status(500).json({
            error: "Gagal mengatur force mode",
            details: err.message
        });
    }
});

// ====================
// MANUAL MODE TIMEOUT
// ====================

/**
 * Set Manual Mode dengan timeout
 * POST /mode/manual/:from
 * Body: { "minutes": 5 }
 */
router.post('/manual/:from', async (req, res) => {
    try {
        const { from } = req.params;
        const { minutes = 1 } = req.body;

        if (typeof minutes !== 'number' || minutes < 0.1 || minutes > 1440) {
            return res.status(400).json({
                error: "Minutes harus berupa number antara 0.1 dan 1440 (24 jam)"
            });
        }

        const result = await modeManager.setManualModeWithTimeout(from, minutes);

        res.json(result);
    } catch (err) {
        console.error("❌ Error setting manual mode:", err);
        res.status(500).json({
            error: "Gagal mengatur manual mode",
            details: err.message
        });
    }
});

// =============
// MODE BIASA
// =============

/**
 * Set mode biasa (bot/manual tanpa timeout)
 * PUT /mode/:from
 * Body: { "mode": "bot"/"manual" }
 */
router.put('/:from', async (req, res) => {
    try {
        const { from } = req.params;
        const { mode } = req.body;

        const result = await modeManager.setMode(from, mode);

        res.json(result);
    } catch (err) {
        console.error("❌ Error setting mode:", err);
        res.status(500).json({
            error: "Gagal mengatur mode",
            details: err.message
        });
    }
});

/**
 * Reset mode ke default (bot)
 * DELETE /mode/:from
 */
router.delete('/:from', async (req, res) => {
    try {
        const { from } = req.params;
        const result = await modeManager.resetMode(from);

        res.json(result);
    } catch (err) {
        console.error("❌ Error resetting mode:", err);
        res.status(500).json({
            error: "Gagal reset mode",
            details: err.message
        });
    }
});

// ====================
// INFO & MONITORING
// ====================

/**
 * Get mode info user
 * GET /mode/:from
 */
router.get('/:from', async (req, res) => {
    try {
        const { from } = req.params;
        const { debug = false } = req.query;
        
        if (debug === 'true') {
            // Detailed debug info
            const info = await modeManager.getDetailedModeStatus(from);
            res.json(info);
        } else {
            // Standard info
            const session = await modeManager.getOrCreateSession(from);
            const info = modeManager.getSessionInfo(session);
            res.json(info);
        }
    } catch (err) {
        console.error("❌ Error getting mode info:", err);
        res.status(500).json({
            error: "Gagal mendapatkan info mode",
            details: err.message
        });
    }
});

/**
 * Get semua user dalam mode manual
 * GET /mode/manual/list
 */
router.get('/manual/list', async (req, res) => {
    try {
        const users = await modeManager.getUsersInManualMode();

        res.json({
            message: `${users.length} user dalam mode manual`,
            users: users
        });
    } catch (err) {
        console.error("❌ Error getting manual mode users:", err);
        res.status(500).json({
            error: "Gagal mendapatkan daftar user manual mode",
            details: err.message
        });
    }
});

/**
 * Cleanup expired sessions
 * POST /mode/cleanup
 */
router.post('/cleanup', async (req, res) => {
    try {
        const result = await modeManager.cleanupExpiredSessions();
        res.json(result);
    } catch (err) {
        console.error("❌ Error cleaning up sessions:", err);
        res.status(500).json({
            error: "Gagal cleanup sessions",
            details: err.message
        });
    }
});

// ===================
// UTILITY ENDPOINTS
// ===================

/**
 * Check apakah user dalam manual mode
 * GET /mode/:from/is-manual
 */
router.get('/:from/is-manual', async (req, res) => {
    try {
        const { from } = req.params;
        const isManual = await modeManager.isInManualMode(from);
        const isForce = await modeManager.isInForceMode(from);

        res.json({
            from: from,
            isInManualMode: isManual,
            isInForceMode: isForce,
            effectiveMode: isManual ? "manual" : "bot"
        });
    } catch (err) {
        console.error("❌ Error checking manual mode:", err);
        res.status(500).json({
            error: "Gagal cek manual mode",
            details: err.message
        });
    }
});

/**
 * Cleanup expired sessions
 * POST /mode/cleanup
 */
router.post('/cleanup', async (req, res) => {
    try {
        const result = await modeManager.cleanupExpiredSessions();
        res.json(result);
    } catch (err) {
        console.error("❌ Error cleaning up sessions:", err);
        res.status(500).json({
            error: "Gagal cleanup sessions",
            details: err.message
        });
    }
});

/**
 * Debug endpoint - fix mode conflicts
 * POST /mode/debug/fix/:from
 */
router.post('/debug/fix/:from', async (req, res) => {
    try {
        const { from } = req.params;
        const session = await modeManager.getOrCreateSession(from);
        
        console.log(`🔧 Fixing mode conflicts for ${from}`);
        
        // Jalankan getEffectiveMode untuk auto-fix expired timeouts
        const effectiveMode = session.getEffectiveMode();
        await session.save();
        
        const info = modeManager.getSessionInfo(session);
        
        res.json({
            message: `Mode conflicts fixed for ${from}`,
            before: req.body,
            after: info,
            effectiveMode
        });
    } catch (err) {
        console.error("❌ Error fixing mode conflicts:", err);
        res.status(500).json({
            error: "Gagal fix mode conflicts",
            details: err.message
        });
    }
});

module.exports = router;
