const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserLogin = require("../models/UserLogin");
const ActivityTracker = require("../services/activityTracker");

const router = express.Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await UserLogin.findOne({ username });
        if (!user) {
            return res.status(403).json({ message: "User tidak ditemukan" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password salah" });
        }

        // Track login activity
        await ActivityTracker.trackLogin(
            user._id, 
            req.ip || req.connection.remoteAddress,
            req.get('User-Agent')
        );

        // Buat token (opsional, bisa skip kalau belum pakai JWT)
        const token = jwt.sign({ userId: user._id, role: user.role, username: user.username, nama_admin: user.nama_admin }, process.env.JWT_SECRET || "rahasia", {
            expiresIn: "1d"
        });

        res.json({
            message: "Login berhasil",
            token,
            _id: user._id,
            role: user.role,
            username: user.username,
            nama_admin: user.nama_admin
        });
        
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

// Logout route
router.post("/logout", async (req, res) => {
    try {
        const { userId, sessionId } = req.body;
        
        if (userId) {
            await ActivityTracker.trackLogout(userId, sessionId);
        }
        
        res.json({ message: "Logout berhasil" });
        
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

module.exports = router;