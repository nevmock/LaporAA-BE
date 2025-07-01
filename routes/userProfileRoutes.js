const express = require("express");
const router = express.Router();
const userProfileController = require("../controllers/userProfileController");

// Get report history for a user
router.get("/:from/report-history", userProfileController.getReportHistory);

// Add a report to user's reportHistory
router.post("/:from/report-history", userProfileController.addReportToHistory);

// Get all reports with status for a user
router.get("/:from/reports-with-status", userProfileController.getAllReportsWithStatus);

// Bulk sync reportHistory semua user
router.post("/bulk-sync-report-history", userProfileController.bulkSyncReportHistory);

module.exports = router;
