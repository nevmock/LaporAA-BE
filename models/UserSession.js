const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    unique: true,
  },
  currentAction: {
    type: String,
    enum: ["create_report", "check_report", "signup"],
  },
  step: {
    type: String,
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Simpan sementara input seperti nama, lokasi, dll
    default: {},
  },
  status: {
    type: String,
    enum: ["in_progress", "done"],
    default: "in_progress",
  },
  mode: {
    type: String,
    enum: ["bot", "manual"],
    default: "bot",
  },
  manualModeUntil: {
    type: Date,
    default: null,
  },
  forceModeManual:{
    type: Boolean,
    default: false,
  },
  pendingFeedbackFor: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Tindakan",
    default: [],
  }
}, {
  timestamps: true,
});

userSessionSchema.methods.activateManualMode = function (minutes = 1) {
  this.mode = "manual";
  this.manualModeUntil = new Date(Date.now() + minutes * 60 * 1000);
  return this.save();
};

// Method untuk mengecek mode efektif berdasarkan forceModeManual dan timeout
userSessionSchema.methods.getEffectiveMode = function () {
  // Jika forceModeManual diaktifkan, selalu manual
  if (this.forceModeManual) {
    return "manual";
  }
  
  // Jika mode manual dan ada timeout, cek apakah sudah expired
  if (this.mode === "manual" && this.manualModeUntil) {
    if (new Date() > this.manualModeUntil) {
      // Timeout expired, kembalikan ke bot mode
      this.mode = "bot";
      this.manualModeUntil = null;
      this.save();
      return "bot";
    }
  }
  
  return this.mode;
};

// import ini untuk mengaktifkan mode manual
// await session.activateManualMode(); // Default: 1 menit

module.exports = mongoose.model("UserSession", userSessionSchema);
