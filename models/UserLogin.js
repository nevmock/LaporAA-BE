// models/UserLogin.js
const mongoose = require("mongoose");

const userLoginSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String, required: true }, // disimpan dalam bentuk hash
    role: { type: String, enum: ["Admin", "Bupati"], required: true }
});

module.exports = mongoose.model("UserLogin", userLoginSchema);