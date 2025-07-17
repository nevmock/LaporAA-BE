const UserSession = require("../models/UserSession");

/**
 * Mode Manager - Pengelolaan terpusat untuk semua mode user
 * 
 * Mode Types:
 * 1. Bot Mode - Bot otomatis merespon
 * 2. Manual Mode - Hanya admin yang merespon
 * 3. Force Manual Mode - Paksa manual tanpa timeout (saklar utama)
 */

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
        
        const previousForceMode = session.forceModeManual;
        
        // Store previous timeout info before modifying
        const previousTimeout = session.manualModeUntil;
        const hadActiveTimeout = previousTimeout && new Date() < previousTimeout;
        
        session.forceModeManual = force;
        
        if (force) {
            // Force mode ON: Set manual dan simpan info timeout untuk restore nanti
            console.log(`🔒 Force mode ENABLED for ${from}`);
            
            // Simpan timeout info untuk restore nanti (jika ada)
            if (session.manualModeUntil) {
                session.data = session.data || {};
                session.data.savedTimeout = session.manualModeUntil;
                console.log(`💾 Saved timeout: ${session.manualModeUntil}`);
            }
            
            session.mode = "manual";
            session.manualModeUntil = null;
        } else {
            // Force mode OFF: Logic pengembalian yang lebih baik
            console.log(`🔓 Force mode DISABLED for ${from}`);
            
            // Restore timeout jika ada yang disimpan
            const savedTimeout = session.data?.savedTimeout;
            if (savedTimeout && new Date() < new Date(savedTimeout)) {
                console.log(`🔄 Restoring saved timeout: ${savedTimeout}`);
                session.mode = "manual";
                session.manualModeUntil = new Date(savedTimeout);
                // Clear saved timeout
                if (session.data) {
                    delete session.data.savedTimeout;
                }
            } else {
                // Cek apakah ada timeout manual yang masih aktif (dari sebelum force mode)
                if (hadActiveTimeout) {
                    console.log(`⏱️ Previous timeout was active, but may have expired during force mode`);
                }
                
                // Tidak ada timeout aktif atau sudah expired, kembalikan ke bot
                console.log(`🤖 No active timeout, returning to bot mode for ${from}`);
                session.mode = "bot";
                session.manualModeUntil = null;
                
                // Clear saved timeout if exists
                if (session.data?.savedTimeout) {
                    delete session.data.savedTimeout;
                }
            }
        }
        
        await session.save();
        
        console.log(`✅ Force mode ${force ? 'activated' : 'deactivated'} for ${from} (${previousForceMode} -> ${force})`);
        
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
        
        // Validasi durasi
        if (minutes < 0.1 || minutes > 1440) {
            return {
                success: false,
                message: "Durasi harus antara 0.1 dan 1440 menit (24 jam)",
                ...this.getSessionInfo(session)
            };
        }
        
        console.log(`⏱️ Setting manual mode with ${minutes} minutes timeout for ${from}`);
        
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
        
        // Jika sedang ada manual mode dengan timeout dan ingin switch ke bot
        // pastikan timeout benar-benar di-clear
        if (mode === "bot" && session.manualModeUntil) {
            console.log(`🔄 Clearing manual mode timeout for ${from}`);
            session.manualModeUntil = null;
        }
        
        // Jika switch ke manual mode tanpa timeout, clear existing timeout
        if (mode === "manual") {
            session.manualModeUntil = null;
        }
        
        session.mode = mode;
        await session.save();
        
        console.log(`✅ Mode changed to ${mode} for ${from}`);
        
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
     * Reset user mode ke bot (untuk testing/debugging)
     * @param {string} from - Nomor WhatsApp user
     * @returns {Object} Session info
     */
    async resetToBotMode(from) {
        const session = await this.getOrCreateSession(from);
        
        session.mode = "bot";
        session.forceModeManual = false;
        session.manualModeUntil = null;
        
        await session.save();
        return {
            success: true,
            message: "Mode berhasil direset ke bot mode",
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
        
        console.log(`🧹 Cleanup: ${result.modifiedCount} expired sessions returned to bot mode`);
        
        return {
            message: `${result.modifiedCount} session expired dikembalikan ke bot mode`,
            modifiedCount: result.modifiedCount
        };
    }

    /**
     * Debug: Get detailed mode status for troubleshooting
     */
    async getDetailedModeStatus(from) {
        const session = await this.getOrCreateSession(from);
        const now = new Date();
        const effectiveMode = session.getEffectiveMode();
        
        return {
            from: session.from,
            mode: session.mode,
            effectiveMode: effectiveMode,
            forceModeManual: session.forceModeManual,
            manualModeUntil: session.manualModeUntil,
            isManualModeExpired: session.manualModeUntil ? now > session.manualModeUntil : null,
            timeLeftMs: session.manualModeUntil && now < session.manualModeUntil ? 
                session.manualModeUntil.getTime() - now.getTime() : null,
            timeLeftMinutes: session.manualModeUntil && now < session.manualModeUntil ? 
                Math.ceil((session.manualModeUntil - now) / (1000 * 60)) : null,
            timestamp: now.toISOString(),
            conflicts: this.detectModeConflicts(session)
        };
    }

    /**
     * Detect potential mode conflicts
     */
    detectModeConflicts(session) {
        const conflicts = [];
        const now = new Date();
        
        // Force mode dengan timeout aktif
        if (session.forceModeManual && session.manualModeUntil) {
            conflicts.push("Force mode aktif tapi ada manual timeout - timeout akan diabaikan");
        }
        
        // Manual mode dengan timeout expired tapi mode masih manual
        if (session.mode === "manual" && session.manualModeUntil && now > session.manualModeUntil && !session.forceModeManual) {
            conflicts.push("Manual mode timeout expired tapi mode belum dikembalikan ke bot");
        }
        
        // Bot mode dengan timeout aktif
        if (session.mode === "bot" && session.manualModeUntil && now < session.manualModeUntil) {
            conflicts.push("Bot mode aktif tapi ada manual timeout yang belum expired");
        }
        
        return conflicts;
    }
}

module.exports = new ModeManager();
