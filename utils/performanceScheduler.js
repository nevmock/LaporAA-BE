const cron = require("node-cron");
const ActivityTracker = require("../services/activityTracker");

class PerformanceScheduler {
    
    static init() {
        // Auto logout inactive sessions setiap 5 menit
        cron.schedule("*/5 * * * *", async () => {
            try {
                const loggedOutCount = await ActivityTracker.autoLogoutInactiveSessions(60); // 60 menit tidak aktif
                if (loggedOutCount > 0) {
                    console.log(`📊 Auto logout ${loggedOutCount} inactive sessions`);
                }
            } catch (error) {
                console.error("Error in auto logout scheduler:", error);
            }
        });

        // Cleanup data lama setiap hari jam 2 pagi
        cron.schedule("0 2 * * *", async () => {
            try {
                await this.cleanupOldData();
                console.log("📊 Performance data cleanup completed");
            } catch (error) {
                console.error("Error in cleanup scheduler:", error);
            }
        });

        console.log("📊 Performance scheduler initialized");
    }

    static async cleanupOldData() {
        const AdminActivity = require("../models/AdminActivity");
        const AdminSession = require("../models/AdminSession");
        
        // Hapus data aktivitas lebih dari 90 hari
        const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        
        await AdminActivity.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        // Hapus session lama yang sudah tidak aktif lebih dari 30 hari
        const sessionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        await AdminSession.deleteMany({
            isActive: false,
            logoutTime: { $lt: sessionCutoff }
        });
    }
}

module.exports = PerformanceScheduler;
