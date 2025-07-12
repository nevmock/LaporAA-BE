const ActivityTracker = require('./activityTracker');

class ReportTrackingUtil {
    
    // Track ketika laporan diassign ke admin
    static async trackReportAssignment(adminId, reportId, tindakanId) {
        try {
            await ActivityTracker.trackReportProcessing(
                adminId,
                reportId,
                tindakanId,
                'process_report',
                'Admin assigned to process report'
            );
        } catch (error) {
            console.error('Error tracking report assignment:', error);
        }
    }

    // Track ketika status laporan diupdate
    static async trackStatusUpdate(adminId, reportId, tindakanId, oldStatus, newStatus) {
        try {
            await ActivityTracker.trackReportProcessing(
                adminId,
                reportId,
                tindakanId,
                'update_report',
                `Status changed from ${oldStatus} to ${newStatus}`
            );
        } catch (error) {
            console.error('Error tracking status update:', error);
        }
    }

    // Track ketika OPD diupdate
    static async trackOpdUpdate(adminId, reportId, tindakanId, opdList) {
        try {
            await ActivityTracker.trackReportProcessing(
                adminId,
                reportId,
                tindakanId,
                'update_report',
                `OPD updated: ${opdList.join(', ')}`
            );
        } catch (error) {
            console.error('Error tracking OPD update:', error);
        }
    }

    // Track ketika foto/evidence diupload
    static async trackEvidenceUpload(adminId, reportId, tindakanId, fileCount) {
        try {
            await ActivityTracker.trackReportProcessing(
                adminId,
                reportId,
                tindakanId,
                'update_report',
                `Uploaded ${fileCount} evidence files`
            );
        } catch (error) {
            console.error('Error tracking evidence upload:', error);
        }
    }

    // Track ketika kesimpulan ditambahkan
    static async trackConclusionUpdate(adminId, reportId, tindakanId, conclusion) {
        try {
            await ActivityTracker.trackReportProcessing(
                adminId,
                reportId,
                tindakanId,
                'update_report',
                'Added conclusion to report'
            );
        } catch (error) {
            console.error('Error tracking conclusion update:', error);
        }
    }

    // Track ketika feedback direquest
    static async trackFeedbackRequest(adminId, reportId, tindakanId) {
        try {
            await ActivityTracker.trackReportProcessing(
                adminId,
                reportId,
                tindakanId,
                'system_action',
                'Requested feedback from user'
            );
        } catch (error) {
            console.error('Error tracking feedback request:', error);
        }
    }

    // Track bulk operations
    static async trackBulkOperation(adminId, operation, reportCount, metadata = {}) {
        try {
            await ActivityTracker.trackSystemAction(
                adminId,
                `bulk_${operation}`,
                `Performed bulk ${operation} on ${reportCount} reports`,
                {
                    reportCount,
                    operation,
                    ...metadata
                }
            );
        } catch (error) {
            console.error('Error tracking bulk operation:', error);
        }
    }
}

module.exports = ReportTrackingUtil;
