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
    default: null, // ⬅️ ini opsional tapi disarankan
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

// import ini untuk mengaktifkan mode manual
// await session.activateManualMode(); // Default: 1 menit

module.exports = mongoose.model("UserSession", userSessionSchema);
