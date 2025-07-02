const AdminActivity = require('../models/AdminActivity');
const AdminSession = require('../models/AdminSession');
const Report = require('../models/Report');
const Tindakan = require('../models/Tindakan');
const UserLogin = require('../models/UserLogin');

class AdminPerformanceController {
    
    // Dashboard utama performa admin
    async getDashboard(req, res) {
        try {
            const { startDate, endDate, adminId } = req.query;
            
            // Set default date range (30 hari terakhir jika tidak ada filter)
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate) : new Date();
            
            const filter = {
                createdAt: { $gte: start, $lte: end }
            };
            
            if (adminId) {
                filter.admin = adminId;
            }

            // Data paralel untuk efisiensi
            const [
                adminStats,
                reportStats,
                activityStats,
                onlineStats
            ] = await Promise.all([
                this.getAdminStatistics(filter),
                this.getReportProcessingStats(filter),
                this.getActivityStatistics(filter),
                this.getOnlineStatistics(filter)
            ]);

            res.json({
                dateRange: { start, end },
                adminStats,
                reportStats,
                activityStats,
                onlineStats
            });

        } catch (error) {
            console.error('Error getting admin performance dashboard:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    // Statistik admin individual
    async getAdminStatistics(filter) {
        const pipeline = [
            {
                $match: filter
            },
            {
                $group: {
                    _id: '$admin',
                    totalActivities: { $sum: 1 },
                    reportActivities: {
                        $sum: {
                            $cond: [
                                { $in: ['$activityType', ['process_report', 'update_report']] },
                                1,
                                0
                            ]
                        }
                    },
                    lastActivity: { $max: '$createdAt' }
                }
            },
            {
                $lookup: {
                    from: 'userlogins',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'admin'
                }
            },
            {
                $unwind: '$admin'
            },
            {
                $project: {
                    adminId: '$_id',
                    adminName: '$admin.nama_admin',
                    role: '$admin.role',
                    totalActivities: 1,
                    reportActivities: 1,
                    lastActivity: 1
                }
            },
            {
                $sort: { totalActivities: -1 }
            }
        ];

        return await AdminActivity.aggregate(pipeline);
    }

    // Statistik pemrosesan laporan per admin
    async getReportProcessingStats(filter) {
        const pipeline = [
            {
                $match: {
                    createdAt: filter.createdAt,
                    processed_by: { $exists: true, $ne: null }
                }
            },
            {
                $lookup: {
                    from: 'tindakans',
                    localField: 'tindakan',
                    foreignField: '_id',
                    as: 'tindakan'
                }
            },
            {
                $unwind: '$tindakan'
            },
            {
                $group: {
                    _id: {
                        admin: '$processed_by',
                        status: '$tindakan.status'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.admin',
                    statusBreakdown: {
                        $push: {
                            status: '$_id.status',
                            count: '$count'
                        }
                    },
                    totalProcessed: { $sum: '$count' }
                }
            },
            {
                $lookup: {
                    from: 'userlogins',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'admin'
                }
            },
            {
                $unwind: '$admin'
            },
            {
                $project: {
                    adminId: '$_id',
                    adminName: '$admin.nama_admin',
                    role: '$admin.role',
                    totalProcessed: 1,
                    statusBreakdown: 1
                }
            },
            {
                $sort: { totalProcessed: -1 }
            }
        ];

        return await Report.aggregate(pipeline);
    }

    // Statistik aktivitas harian
    async getActivityStatistics(filter) {
        const pipeline = [
            {
                $match: filter
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        admin: '$admin',
                        activityType: '$activityType'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: {
                        date: '$_id.date',
                        admin: '$_id.admin'
                    },
                    activities: {
                        $push: {
                            type: '$_id.activityType',
                            count: '$count'
                        }
                    },
                    totalActivities: { $sum: '$count' }
                }
            },
            {
                $lookup: {
                    from: 'userlogins',
                    localField: '_id.admin',
                    foreignField: '_id',
                    as: 'admin'
                }
            },
            {
                $unwind: '$admin'
            },
            {
                $project: {
                    date: '$_id.date',
                    adminId: '$_id.admin',
                    adminName: '$admin.nama_admin',
                    activities: 1,
                    totalActivities: 1
                }
            },
            {
                $sort: { date: -1, totalActivities: -1 }
            }
        ];

        return await AdminActivity.aggregate(pipeline);
    }

    // Statistik online/offline admin
    async getOnlineStatistics(filter) {
        const sessionFilter = {
            loginTime: filter.createdAt
        };

        const pipeline = [
            {
                $match: sessionFilter
            },
            {
                $group: {
                    _id: '$admin',
                    totalSessions: { $sum: 1 },
                    totalDuration: { $sum: '$sessionDuration' },
                    avgDuration: { $avg: '$sessionDuration' },
                    lastLogin: { $max: '$loginTime' },
                    activeSessions: {
                        $sum: {
                            $cond: ['$isActive', 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'userlogins',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'admin'
                }
            },
            {
                $unwind: '$admin'
            },
            {
                $project: {
                    adminId: '$_id',
                    adminName: '$admin.nama_admin',
                    role: '$admin.role',
                    totalSessions: 1,
                    totalDuration: 1,
                    avgDuration: { $round: ['$avgDuration', 2] },
                    lastLogin: 1,
                    isCurrentlyOnline: { $gt: ['$activeSessions', 0] }
                }
            },
            {
                $sort: { lastLogin: -1 }
            }
        ];

        return await AdminSession.aggregate(pipeline);
    }

    // Detail performa admin tertentu
    async getAdminDetail(req, res) {
        try {
            const { adminId } = req.params;
            const { startDate, endDate } = req.query;
            
            const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = endDate ? new Date(endDate) : new Date();
            
            const filter = {
                admin: adminId,
                createdAt: { $gte: start, $lte: end }
            };

            const [
                adminInfo,
                activities,
                sessions,
                processedReports
            ] = await Promise.all([
                UserLogin.findById(adminId).select('nama_admin username role'),
                AdminActivity.find(filter)
                    .populate('relatedReport', 'sessionId message')
                    .populate('relatedTindakan', 'status trackingId')
                    .sort({ createdAt: -1 })
                    .limit(100),
                AdminSession.find({ 
                    admin: adminId, 
                    loginTime: { $gte: start, $lte: end } 
                }).sort({ loginTime: -1 }),
                Report.find({
                    processed_by: adminId,
                    createdAt: { $gte: start, $lte: end }
                }).populate('tindakan', 'status trackingId')
                  .sort({ createdAt: -1 })
            ]);

            res.json({
                adminInfo,
                activities,
                sessions,
                processedReports,
                dateRange: { start, end }
            });

        } catch (error) {
            console.error('Error getting admin detail:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    // Real-time status admin
    async getAdminStatus(req, res) {
        try {
            const activeAdmins = await AdminSession.find({ isActive: true })
                .populate('admin', 'nama_admin role')
                .sort({ lastActivity: -1 });

            const adminStatusList = activeAdmins.map(session => ({
                adminId: session.admin._id,
                adminName: session.admin.nama_admin,
                role: session.admin.role,
                loginTime: session.loginTime,
                lastActivity: session.lastActivity,
                sessionDuration: Math.round((Date.now() - session.loginTime) / (1000 * 60)), // menit
                activityCount: session.activityCount,
                isOnline: (Date.now() - session.lastActivity) < 5 * 60 * 1000 // online jika aktivitas < 5 menit yang lalu
            }));

            res.json({
                totalOnline: adminStatusList.filter(admin => admin.isOnline).length,
                totalActive: adminStatusList.length,
                adminList: adminStatusList
            });

        } catch (error) {
            console.error('Error getting admin status:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    // Laporan performa bulanan
    async getMonthlyReport(req, res) {
        try {
            const { year, month } = req.query;
            const currentYear = year || new Date().getFullYear();
            const currentMonth = month || new Date().getMonth() + 1;

            const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
            const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

            const filter = {
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            };

            const monthlyStats = await this.calculateMonthlyMetrics(filter);

            res.json({
                period: {
                    year: currentYear,
                    month: currentMonth,
                    startDate: startOfMonth,
                    endDate: endOfMonth
                },
                ...monthlyStats
            });

        } catch (error) {
            console.error('Error getting monthly report:', error);
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }

    async calculateMonthlyMetrics(filter) {
        // Implementasi perhitungan metrik bulanan
        const [
            totalActivities,
            totalReportsProcessed,
            avgResponseTime,
            adminProductivity
        ] = await Promise.all([
            AdminActivity.countDocuments(filter),
            Report.countDocuments({
                createdAt: filter.createdAt,
                processed_by: { $exists: true, $ne: null }
            }),
            this.calculateAvgResponseTime(filter),
            this.calculateAdminProductivity(filter)
        ]);

        return {
            totalActivities,
            totalReportsProcessed,
            avgResponseTime,
            adminProductivity
        };
    }

    async calculateAvgResponseTime(filter) {
        // Implementasi perhitungan rata-rata waktu respon
        // Bisa dihitung dari selisih waktu laporan masuk vs diproses
        return 0; // placeholder
    }

    async calculateAdminProductivity(filter) {
        // Implementasi perhitungan produktivitas admin
        // Laporan per jam kerja, dll
        return []; // placeholder
    }
}

const adminPerformanceController = new AdminPerformanceController();

// Bind methods to preserve 'this' context
adminPerformanceController.getDashboard = adminPerformanceController.getDashboard.bind(adminPerformanceController);
adminPerformanceController.getAdminDetail = adminPerformanceController.getAdminDetail.bind(adminPerformanceController);
adminPerformanceController.getAdminStatus = adminPerformanceController.getAdminStatus.bind(adminPerformanceController);
adminPerformanceController.getMonthlyReport = adminPerformanceController.getMonthlyReport.bind(adminPerformanceController);

module.exports = adminPerformanceController;
