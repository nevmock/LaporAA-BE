// models/UserLogin.js
const mongoose = require("mongoose");

const userLoginSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Admin", "Bupati", "SuperAdmin"], required: true },
    // twoFactorSecret: { type: String } // tambahan untuk 2FA
});

module.exports = mongoose.model("UserLogin", userLoginSchema);