const Report = require("../models/Report");
const Tindakan = require("../models/Tindakan");

class RealTimeService {
    static async getUpdatedPendingCount() {
        try {
            // Query yang sama seperti di reportCount route
            const reports = await Report.find()
                .populate("user")
                .populate({
                    path: "tindakan",
                    model: "Tindakan"
                });

            // Filter hanya yang tindakan status-nya "Perlu Verifikasi"
            const filtered = reports.filter(r =>
                r.tindakan?.status === "Perlu Verifikasi"
            );

            return filtered.length;
        } catch (error) {
            console.error("❌ Error getting pending count:", error);
            return 0;
        }
    }

    static async emitPendingCountUpdate(io) {
        try {
            const pendingCount = await this.getUpdatedPendingCount();
            
            if (io) {
                io.to('admins').emit('pendingCountUpdate', pendingCount);
                console.log(`📊 Real-time: Pending count updated to ${pendingCount}`);
            }
            
            return pendingCount;
        } catch (error) {
            console.error("❌ Error emitting pending count update:", error);
            return 0;
        }
    }

    static async emitNewReportNotification(io, reportData) {
        try {
            if (io) {
                // Emit new report notification
                io.to('admins').emit('newReportCreated', {
                    reportId: reportData.reportId,
                    sessionId: reportData.sessionId,
                    from: reportData.from,
                    userName: reportData.userName,
                    message: reportData.message,
                    location: reportData.location,
                    coordinates: reportData.coordinates,
                    timestamp: new Date()
                });

                // Update pending count
                await this.emitPendingCountUpdate(io);
                
                console.log(`📋 Real-time: New report notification sent (${reportData.sessionId}) from ${reportData.userName}`);
            }
        } catch (error) {
            console.error("❌ Error emitting new report notification:", error);
        }
    }

    static async emitStatusChangeNotification(io, statusData) {
        try {
            if (io) {
                // Emit status change notification
                io.to('admins').emit('tindakanStatusUpdated', {
                    reportId: statusData.reportId,
                    oldStatus: statusData.oldStatus,
                    newStatus: statusData.newStatus,
                    sessionId: statusData.sessionId,
                    timestamp: new Date()
                });

                // Update pending count jika ada perubahan yang mempengaruhi count
                if (statusData.oldStatus === "Perlu Verifikasi" || statusData.newStatus === "Perlu Verifikasi") {
                    await this.emitPendingCountUpdate(io);
                }
                
                console.log(`🔄 Real-time: Status change notification sent (${statusData.sessionId}): ${statusData.oldStatus} → ${statusData.newStatus}`);
            }
        } catch (error) {
            console.error("❌ Error emitting status change notification:", error);
        }
    }

    static async emitGeneralNotification(io, type, data) {
        try {
            if (io) {
                io.to('admins').emit('generalNotification', {
                    type,
                    data,
                    timestamp: new Date()
                });
                
                console.log(`🔔 Real-time: General notification sent (${type})`);
            }
        } catch (error) {
            console.error("❌ Error emitting general notification:", error);
        }
    }

    // Utility method untuk cek koneksi socket
    static checkSocketConnection(io) {
        if (!io) {
            console.warn("⚠️ Socket.IO instance not available");
            return false;
        }
        return true;
    }

    // Method untuk emit ke room tertentu
    static emitToRoom(io, room, event, data) {
        try {
            if (this.checkSocketConnection(io)) {
                io.to(room).emit(event, data);
                console.log(`📡 Real-time: Emitted ${event} to room ${room}`);
            }
        } catch (error) {
            console.error(`❌ Error emitting to room ${room}:`, error);
        }
    }

    // Method untuk emit ke semua admin
    static emitToAdmins(io, event, data) {
        this.emitToRoom(io, 'admins', event, data);
    }

    // Method untuk emit global
    static emitGlobal(io, event, data) {
        this.emitToRoom(io, 'global', event, data);
    }
}

module.exports = RealTimeService;
