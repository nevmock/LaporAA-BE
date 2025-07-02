const mongoose = require("mongoose");

const adminActivitySchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserLogin",
        required: true,
        index: true
    },
    activityType: {
        type: String,
        enum: ["login", "logout", "process_report", "update_report", "system_action"],
        required: true,
        index: true
    },
    description: {
        type: String,
        default: ""
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    sessionDuration: {
        type: Number, // dalam menit
        default: null
    },
    relatedReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
        default: null
    },
    relatedTindakan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tindakan",
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
});

// Index untuk performa query
adminActivitySchema.index({ admin: 1, activityType: 1, createdAt: -1 });
adminActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminActivity", adminActivitySchema);
