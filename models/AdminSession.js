const mongoose = require("mongoose");

const adminSessionSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserLogin",
        required: true,
        index: true
    },
    loginTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    logoutTime: {
        type: Date,
        default: null
    },
    sessionDuration: {
        type: Number, // dalam menit
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    activityCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
});

// Index untuk performa query
adminSessionSchema.index({ admin: 1, isActive: 1 });
adminSessionSchema.index({ loginTime: -1 });
adminSessionSchema.index({ lastActivity: -1 });

// Method untuk update aktivitas terakhir
adminSessionSchema.methods.updateActivity = function() {
    this.lastActivity = new Date();
    this.activityCount += 1;
    return this.save();
};

// Method untuk logout
adminSessionSchema.methods.logout = function() {
    this.logoutTime = new Date();
    this.isActive = false;
    this.sessionDuration = Math.round((this.logoutTime - this.loginTime) / (1000 * 60)); // menit
    return this.save();
};

module.exports = mongoose.model("AdminSession", adminSessionSchema);
