const express = require("express");
const bcrypt = require("bcryptjs");
const userLoginRepo = require("../repositories/userLoginRepo");

const router = express.Router();

// GET semua user login
router.get("/", async (req, res) => {
    try {
        const users = await userLoginRepo.findAll();
        res.json(users);
    } catch (error) {
        console.error("Error getting user logins:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET user login by ID
router.get("/:id", async (req, res) => {
    try {
        const user = await userLoginRepo.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Error getting user login:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST buat user login baru
router.post("/", async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const existing = await userLoginRepo.findByUsername(username);
        if (existing) return res.status(409).json({ message: "Username already exists" });

        const hashed = await bcrypt.hash(password, 10);
        const user = await userLoginRepo.create({ username, password: hashed, role });

        res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user login:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT update user login
router.put("/:id", async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const data = {
            username,
            role,
        };

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        const updated = await userLoginRepo.update(req.params.id, data);
        if (!updated) return res.status(404).json({ message: "User not found" });

        res.json(updated);
    } catch (error) {
        console.error("Error updating user login:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE user login
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await userLoginRepo.delete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User deleted" });
    } catch (error) {
        console.error("Error deleting user login:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
