const userProfileRepo = require("../repositories/userProfileRepo");

// GET /user-profile/:from/report-history
async function getReportHistory(req, res) {
    try {
        const { from } = req.params;
        const history = await userProfileRepo.getReportHistoryByFrom(from);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /user-profile/:from/report-history
async function addReportToHistory(req, res) {
    try {
        const { from } = req.params;
        const { sessionId } = req.body;
        const updated = await userProfileRepo.addReportToHistory(from, sessionId);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// GET /user-profile/:from/reports-with-status
async function getAllReportsWithStatus(req, res) {
    try {
        const { from } = req.params;
        const reports = await userProfileRepo.getAllReportsWithStatusByFrom(from);
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /user-profile/bulk-sync-report-history
async function bulkSyncReportHistory(req, res) {
    try {
        const result = await userProfileRepo.bulkSyncReportHistoryForAllUsers();
        res.json({ message: "Bulk sync completed", ...result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getReportHistory,
    addReportToHistory,
    getAllReportsWithStatus,
    bulkSyncReportHistory
};
