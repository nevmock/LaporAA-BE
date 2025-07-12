const AdminActivity = require('../models/AdminActivity');
const AdminSession = require('../models/AdminSession');

class ActivityTracker {
    
    // Track login admin
    static async trackLogin(adminId, ipAddress = null, userAgent = null) {
        try {
            // Tutup session lama yang masih aktif
            const activeSessions = await AdminSession.find({ admin: adminId, isActive: true });
            
            for (const session of activeSessions) {
                const sessionDurationMinutes = Math.round((new Date() - session.loginTime) / (1000 * 60));
                await AdminSession.updateOne(
                    { _id: session._id },
                    { 
                        isActive: false, 
                        logoutTime: new Date(),
                        sessionDuration: sessionDurationMinutes
                    }
                );
            }

            // Buat session baru
            const session = new AdminSession({
                admin: adminId,
                ipAddress,
                userAgent,
                loginTime: new Date(),
                isActive: true,
                lastActivity: new Date()
            });
            await session.save();

            // Track activity
            await AdminActivity.create({
                admin: adminId,
                activityType: 'login',
                description: 'Admin logged in',
                ipAddress,
                userAgent,
                metadata: {
                    sessionId: session._id
                }
            });

            return session;

        } catch (error) {
            console.error('Error tracking login:', error);
            throw error;
        }
    }

    // Track logout admin
    static async trackLogout(adminId, sessionId = null) {
        try {
            let session;
            
            if (sessionId) {
                session = await AdminSession.findById(sessionId);
            } else {
                session = await AdminSession.findOne({ 
                    admin: adminId, 
                    isActive: true 
                }).sort({ loginTime: -1 });
            }

            if (session) {
                await session.logout();
                
                await AdminActivity.create({
                    admin: adminId,
                    activityType: 'logout',
                    description: 'Admin logged out',
                    sessionDuration: session.sessionDuration,
                    metadata: {
                        sessionId: session._id,
                        totalActivities: session.activityCount
                    }
                });
            }

            return session;

        } catch (error) {
            console.error('Error tracking logout:', error);
            throw error;
        }
    }

    // Track pemrosesan laporan
    static async trackReportProcessing(adminId, reportId, tindakanId, action = 'process_report', description = '') {
        try {
            // Update aktivitas terakhir session
            const session = await AdminSession.findOne({ 
                admin: adminId, 
                isActive: true 
            }).sort({ loginTime: -1 });

            if (session) {
                await session.updateActivity();
            }

            // Track activity
            await AdminActivity.create({
                admin: adminId,
                activityType: action,
                description: description || `Admin ${action.replace('_', ' ')} report`,
                relatedReport: reportId,
                relatedTindakan: tindakanId,
                metadata: {
                    sessionId: session?._id
                }
            });

        } catch (error) {
            console.error('Error tracking report processing:', error);
            throw error;
        }
    }

    // Track aktivitas sistem umum
    static async trackSystemAction(adminId, action, description = '', metadata = {}) {
        try {
            // Update aktivitas terakhir session
            const session = await AdminSession.findOne({ 
                admin: adminId, 
                isActive: true 
            }).sort({ loginTime: -1 });

            if (session) {
                await session.updateActivity();
            }

            await AdminActivity.create({
                admin: adminId,
                activityType: 'system_action',
                description: description || action,
                metadata: {
                    action,
                    sessionId: session?._id,
                    ...metadata
                }
            });

        } catch (error) {
            console.error('Error tracking system action:', error);
            throw error;
        }
    }

    // Update aktivitas terakhir (untuk keep-alive)
    static async updateLastActivity(adminId) {
        try {
            const session = await AdminSession.findOne({ 
                admin: adminId, 
                isActive: true 
            }).sort({ loginTime: -1 });

            if (session) {
                await session.updateActivity();
            }

            return session;

        } catch (error) {
            console.error('Error updating last activity:', error);
            throw error;
        }
    }

    // Auto logout session yang sudah tidak aktif
    static async autoLogoutInactiveSessions(inactiveMinutes = 60) {
        try {
            const cutoffTime = new Date(Date.now() - inactiveMinutes * 60 * 1000);
            
            const inactiveSessions = await AdminSession.find({
                isActive: true,
                lastActivity: { $lt: cutoffTime }
            });

            for (const session of inactiveSessions) {
                await session.logout();
                
                await AdminActivity.create({
                    admin: session.admin,
                    activityType: 'logout',
                    description: 'Auto logout due to inactivity',
                    sessionDuration: session.sessionDuration,
                    metadata: {
                        sessionId: session._id,
                        reason: 'auto_logout',
                        inactiveMinutes
                    }
                });
            }

            return inactiveSessions.length;

        } catch (error) {
            console.error('Error auto logout inactive sessions:', error);
            throw error;
        }
    }
}

module.exports = ActivityTracker;
