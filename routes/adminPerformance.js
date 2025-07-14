const express = require('express');
const adminPerformanceController = require('../controllers/adminPerformanceController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Middleware auth untuk semua route
router.use(authMiddleware);

// Dashboard utama performa admin
router.get('/dashboard', adminPerformanceController.getDashboard);

// Detail performa admin tertentu
router.get('/admin/:adminId', adminPerformanceController.getAdminDetail);

// Status online admin real-time
router.get('/status', adminPerformanceController.getAdminStatus);

// Laporan bulanan
router.get('/monthly', adminPerformanceController.getMonthlyReport);

module.exports = router;
