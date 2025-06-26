const UserSession = require("../models/UserSession");

/**
 * Mode Manager - Pengelolaan terpusat untuk semua mode user
 * 
 * Mode Types:
 * 1. Bot Mode - Bot otomatis merespon
 * 2. Manual Mode - Hanya admin yang merespon
 * 3. Force Manual Mode - Paksa manual tanpa timeout (saklar utama)
 */

// ismail anugrah saputra annugrah

class ModeManager {
    /**
     * Mendapatkan atau membuat session user
     */
    async getOrCreateSession(from) {
        let session = await UserSession.findOne({ from });
        if (!session) {
            session = await UserSession.create({
                from,
                currentAction: null,
                step: "MAIN_MENU",
                data: {},
                mode: "bot",
                forceModeManual: false,
                manualModeUntil: null
            });
        }
        return session;
    }

    /**
     * Mendapatkan mode efektif user (dengan auto-expire timeout)
     */
    async getEffectiveMode(from) {
        const session = await this.getOrCreateSession(from);
        return session.getEffectiveMode();
    }

    /**
     * Set Force Mode Manual (Saklar Utama)
     * @param {string} from - Nomor WhatsApp user
     * @param {boolean} force - true untuk aktifkan, false untuk nonaktifkan
     * @returns {Object} Session info
     */
    async setForceMode(from, force) {
        const session = await this.getOrCreateSession(from);
        
        session.forceModeManual = force;
        
        if (force) {
            // Force mode ON: Set manual dan hapus timeout
            session.mode = "manual";
            session.manualModeUntil = null;
        } else {
            // Force mode OFF: Cek apakah ada timeout manual yang masih aktif
            if (!session.manualModeUntil || new Date() > session.manualModeUntil) {
                session.mode = "bot";
                session.manualModeUntil = null;
            }
            // Jika ada timeout aktif, biarkan tetap manual sampai timeout habis
        }
        
        await session.save();
        return this.getSessionInfo(session);
    }

    /**
     * Set Manual Mode dengan timeout (bukan force)
     * @param {string} from - Nomor WhatsApp user
     * @param {number} minutes - Durasi timeout dalam menit
     * @returns {Object} Session info
     */
    async setManualModeWithTimeout(from, minutes = 1) {
        const session = await this.getOrCreateSession(from);
        
        // Jika force mode aktif, ignore request ini
        if (session.forceModeManual) {
            return {
                success: false,
                message: "Force mode aktif, tidak bisa set manual mode dengan timeout",
                ...this.getSessionInfo(session)
            };
        }
        
        await session.activateManualMode(minutes);
        return {
            success: true,
            message: `Manual mode diaktifkan untuk ${minutes} menit`,
            ...this.getSessionInfo(session)
        };
    }

    /**
     * Set mode biasa (bot/manual tanpa timeout)
     * @param {string} from - Nomor WhatsApp user
     * @param {string} mode - "bot" atau "manual"
     * @returns {Object} Session info
     */
    async setMode(from, mode) {
        if (!["bot", "manual"].includes(mode)) {
            throw new Error("Mode harus 'bot' atau 'manual'");
        }

        const session = await this.getOrCreateSession(from);
        
        // Jika force mode aktif, ignore request ini
        if (session.forceModeManual) {
            return {
                success: false,
                message: "Force mode aktif, tidak bisa mengubah mode",
                ...this.getSessionInfo(session)
            };
        }
        
        session.mode = mode;
        session.manualModeUntil = null; // Clear timeout jika ada
        await session.save();
        
        return {
            success: true,
            message: `Mode diubah ke ${mode}`,
            ...this.getSessionInfo(session)
        };
    }

    /**
     * Reset mode ke default (bot)
     */
    async resetMode(from) {
        const session = await this.getOrCreateSession(from);
        
        // Force mode tidak bisa direset kecuali dengan setForceMode
        if (session.forceModeManual) {
            return {
                success: false,
                message: "Force mode aktif, gunakan setForceMode untuk reset",
                ...this.getSessionInfo(session)
            };
        }
        
        session.mode = "bot";
        session.manualModeUntil = null;
        await session.save();
        
        return {
            success: true,
            message: "Mode direset ke bot",
            ...this.getSessionInfo(session)
        };
    }

    /**
     * Cek apakah user sedang dalam mode manual (efektif)
     */
    async isInManualMode(from) {
        const effectiveMode = await this.getEffectiveMode(from);
        return effectiveMode === "manual";
    }

    /**
     * Cek apakah user sedang dalam force mode
     */
    async isInForceMode(from) {
        const session = await this.getOrCreateSession(from);
        return session.forceModeManual;
    }

    /**
     * Mendapatkan info lengkap session
     */
    getSessionInfo(session) {
        const effectiveMode = session.getEffectiveMode();
        const now = new Date();
        
        return {
            from: session.from,
            mode: session.mode,
            effectiveMode: effectiveMode,
            forceModeManual: session.forceModeManual,
            manualModeUntil: session.manualModeUntil,
            isManualModeExpired: session.manualModeUntil ? now > session.manualModeUntil : null,
            timeLeft: session.manualModeUntil && now < session.manualModeUntil ? 
                Math.ceil((session.manualModeUntil - now) / (1000 * 60)) + " menit" : null
        };
    }

    /**
     * Mendapatkan semua user yang sedang dalam mode manual
     */
    async getUsersInManualMode() {
        const sessions = await UserSession.find({
            $or: [
                { forceModeManual: true },
                { 
                    mode: "manual", 
                    manualModeUntil: { $gte: new Date() } 
                }
            ]
        });
        
        return sessions.map(session => this.getSessionInfo(session));
    }

    /**
     * Cleanup expired manual mode sessions
     */
    async cleanupExpiredSessions() {
        const result = await UserSession.updateMany(
            {
                mode: "manual",
                manualModeUntil: { $lt: new Date() },
                forceModeManual: false
            },
            {
                $set: { mode: "bot" },
                $unset: { manualModeUntil: 1 }
            }
        );
        
        return {
            message: `${result.modifiedCount} session expired dikembalikan ke bot mode`,
            modifiedCount: result.modifiedCount
        };
    }
}

module.exports = new ModeManager();
