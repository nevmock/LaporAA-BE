const mongoose = require('mongoose');

const LimitLogSchema = new mongoose.Schema({
    phoneNumber: String,
    date: { type: Date, default: () => new Date().setHours(0, 0, 0, 0) }, // reset harian
});

LimitLogSchema.index({ phoneNumber: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('LimitLog', LimitLogSchema);
