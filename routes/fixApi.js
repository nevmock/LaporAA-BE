const express = require("express");
const router = express.Router();
const Tindakan = require("../models/Tindakan");
const { cleanOpdArray } = require("../utils/opdValidator");

router.patch("/fix-ditolak", async (req, res) => {
    try {
        const now = new Date();

        const updateStatusResult = await Tindakan.updateMany(
            { status: "Ditolak" },
            { $set: { status: "Ditutup", updatedAt: now } }
        );

        const updateFeedbackResult = await Tindakan.updateMany(
            { feedbackStatus: "Selesai Ditolak" },
            { $set: { feedbackStatus: "Selesai Ditutup", updatedAt: now } }
        );

        res.json({
            message: "✅ Semua data berhasil diperbarui.",
            updatedStatusCount: updateStatusResult.modifiedCount,
            updatedFeedbackStatusCount: updateFeedbackResult.modifiedCount,
        });
    } catch (error) {
        console.error("❌ Gagal update tindakan:", error);
        res.status(500).json({ error: "Gagal update data tindakan" });
    }
});

router.post("/convert-opd-to-array", async (req, res) => {
    try {
        // Mendapatkan semua dokumen tindakan
        const allTindakan = await Tindakan.find({});
        let convertedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        // Proses setiap dokumen
        for (const tindakan of allTindakan) {
            try {
                // Simpan opd lama untuk perbandingan
                const oldOpd = tindakan.opd;
                
                // Bersihkan menggunakan utility function
                const cleanedOpd = cleanOpdArray(tindakan.opd);
                
                // Cek apakah ada perubahan
                const needsUpdate = JSON.stringify(oldOpd) !== JSON.stringify(cleanedOpd);
                
                if (needsUpdate) {
                    tindakan.opd = cleanedOpd;
                    await tindakan.save();
                    convertedCount++;
                } else {
                    skippedCount++;
                }
            } catch (err) {
                console.error(`Error saat memproses tindakan ID: ${tindakan._id}`, err);
                errorCount++;
            }
        }

        res.status(200).json({
            message: "Proses konversi dan pembersihan OPD selesai",
            total: allTindakan.length,
            converted: convertedCount,
            skipped: skippedCount,
            errors: errorCount,
            details: {
                description: "Konversi telah membersihkan string kosong dan spasi dari array OPD",
                cleaningRules: [
                    "String kosong ('') dihapus dari array",
                    "String hanya spasi ('   ') dihapus dari array", 
                    "null dan undefined dikonversi menjadi array kosong",
                    "String tunggal dikonversi menjadi array dengan 1 elemen",
                    "Semua elemen di-trim (hapus spasi di awal/akhir)"
                ]
            }
        });
    } catch (error) {
        console.error("❌ Error converting OPD data:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat konversi data" });
    }
});

// API untuk testing validasi OPD
router.post("/test-opd-validation", async (req, res) => {
    try {
        const { opd } = req.body;
        
        const { cleanOpdArray, validateAndCleanOpd } = require("../utils/opdValidator");
        
        const result = validateAndCleanOpd(opd);
        
        res.status(200).json({
            message: "Test validasi OPD",
            input: opd,
            result: result,
            inputType: Array.isArray(opd) ? 'array' : typeof opd
        });
    } catch (error) {
        console.error("❌ Error testing OPD validation:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat test validasi" });
    }
});

module.exports = router;
