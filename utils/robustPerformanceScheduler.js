const cron = require("node-cron");
const ActivityTracker = require("../services/activityTracker");

class RobustPerformanceScheduler {
    
    static init() {
        console.log("📊 Initializing robust performance scheduler...");

        // Auto logout inactive sessions setiap 5 menit dengan retry mechanism
        cron.schedule("*/5 * * * *", async () => {
            await this.executeWithRetry(
                async () => {
                    const loggedOutCount = await ActivityTracker.autoLogoutInactiveSessions(60);
                    if (loggedOutCount > 0) {
                        console.log(`📊 Auto logout ${loggedOutCount} inactive sessions`);
                    }
                    return loggedOutCount;
                },
                "Auto logout inactive sessions",
                3 // max retries
            );
        });

        // Cleanup data lama setiap hari jam 2 pagi dengan retry mechanism
        cron.schedule("0 2 * * *", async () => {
            await this.executeWithRetry(
                async () => {
                    await this.cleanupOldData();
                    console.log("📊 Performance data cleanup completed");
                },
                "Performance data cleanup",
                2 // max retries for cleanup
            );
        });

        console.log("📊 Robust performance scheduler initialized");
    }

    /**
     * Execute database operation with retry mechanism
     */
    static async executeWithRetry(operation, operationName, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 ${operationName} - Attempt ${attempt}/${maxRetries}`);
                
                const result = await Promise.race([
                    operation(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Operation timeout')), 30000) // 30 second timeout
                    )
                ]);
                
                console.log(`✅ ${operationName} completed successfully`);
                return result;
                
            } catch (error) {
                console.error(`❌ ${operationName} failed (attempt ${attempt}/${maxRetries}):`, error.message);
                
                // Check if it's a timeout or connection error
                const isConnectionError = error.message.includes('ETIMEDOUT') || 
                                        error.message.includes('ECONNRESET') ||
                                        error.message.includes('timeout') ||
                                        error.code === 'ETIMEDOUT';
                
                if (isConnectionError && attempt < maxRetries) {
                    // Wait longer for connection errors with exponential backoff
                    const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
                    console.log(`⏳ Connection error detected, waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else if (attempt < maxRetries) {
                    // Regular retry with shorter wait
                    const waitTime = 2000 * attempt; // 2s, 4s, 6s
                    console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    console.error(`❌ ${operationName} failed after ${maxRetries} attempts:`, error.message);
                    // Don't throw error - log and continue
                    return null;
                }
            }
        }
    }

    /**
     * Cleanup old data with chunked operations to prevent timeouts
     */
    static async cleanupOldData() {
        const AdminActivity = require("../models/AdminActivity");
        const AdminSession = require("../models/AdminSession");
        
        // Cleanup in smaller chunks to prevent timeouts
        const CHUNK_SIZE = 1000;
        
        // Hapus data aktivitas lebih dari 90 hari dalam chunks
        const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        
        console.log("🧹 Starting AdminActivity cleanup...");
        let deletedActivities = 0;
        let hasMore = true;
        
        while (hasMore) {
            const batch = await AdminActivity.find({
                createdAt: { $lt: cutoffDate }
            }).limit(CHUNK_SIZE).select('_id');
            
            if (batch.length === 0) {
                hasMore = false;
                break;
            }
            
            const ids = batch.map(doc => doc._id);
            const result = await AdminActivity.deleteMany({
                _id: { $in: ids }
            });
            
            deletedActivities += result.deletedCount;
            console.log(`🧹 Deleted ${result.deletedCount} activities (total: ${deletedActivities})`);
            
            // Short break between chunks
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Hapus session lama dalam chunks
        const sessionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        console.log("🧹 Starting AdminSession cleanup...");
        let deletedSessions = 0;
        hasMore = true;
        
        while (hasMore) {
            const batch = await AdminSession.find({
                isActive: false,
                logoutTime: { $lt: sessionCutoff }
            }).limit(CHUNK_SIZE).select('_id');
            
            if (batch.length === 0) {
                hasMore = false;
                break;
            }
            
            const ids = batch.map(doc => doc._id);
            const result = await AdminSession.deleteMany({
                _id: { $in: ids }
            });
            
            deletedSessions += result.deletedCount;
            console.log(`🧹 Deleted ${result.deletedCount} sessions (total: ${deletedSessions})`);
            
            // Short break between chunks
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`🧹 Cleanup completed: ${deletedActivities} activities, ${deletedSessions} sessions deleted`);
    }

    /**
     * Health check for scheduler
     */
    static async healthCheck() {
        try {
            // Test database connection
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState !== 1) {
                return {
                    healthy: false,
                    reason: 'Database not connected'
                };
            }

            // Test a simple query
            const AdminSession = require("../models/AdminSession");
            await AdminSession.findOne().limit(1);

            return {
                healthy: true,
                timestamp: new Date().toISOString(),
                dbStatus: 'connected'
            };
        } catch (error) {
            return {
                healthy: false,
                reason: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = RobustPerformanceScheduler;
