const ActivityTracker = require('../services/activityTracker');

// Middleware untuk tracking aktivitas admin secara otomatis
const activityTrackingMiddleware = (action = 'system_action') => {
    return async (req, res, next) => {
        try {
            // Ambil admin ID dari token/session (asumsi sudah ada di req.user dari authMiddleware)
            const adminId = req.user?.id || req.user?._id;
            
            if (adminId) {
                // Update aktivitas terakhir
                await ActivityTracker.updateLastActivity(adminId);
                
                // Track action spesifik jika diperlukan
                if (action !== 'system_action') {
                    await ActivityTracker.trackSystemAction(
                        adminId, 
                        action, 
                        `Admin accessed ${req.method} ${req.path}`,
                        {
                            method: req.method,
                            path: req.path,
                            query: req.query,
                            userAgent: req.get('User-Agent'),
                            ip: req.ip
                        }
                    );
                }
            }
            
            next();
        } catch (error) {
            console.error('Error in activity tracking middleware:', error);
            // Jangan block request meskipun tracking gagal
            next();
        }
    };
};

module.exports = activityTrackingMiddleware;
