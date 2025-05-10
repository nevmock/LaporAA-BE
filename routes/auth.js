const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserLogin = require("../models/UserLogin");

const router = express.Router();

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await UserLogin.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password salah" });
        }

        // Buat token (opsional, bisa skip kalau belum pakai JWT)
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "rahasia", {
            expiresIn: "1d"
        });

        res.json({
            message: "Login berhasil",
            token,
            role: user.role,
            username: user.username
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
});

module.exports = router;