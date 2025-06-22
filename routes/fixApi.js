const express = require("express");
const router = express.Router();
const Tindakan = require("../models/Tindakan");

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
                // Memeriksa jenis data dari opd
                if (tindakan.opd === undefined || tindakan.opd === null) {
                    // Jika undefined atau null, atur sebagai array kosong
                    tindakan.opd = [];
                    await tindakan.save();
                    convertedCount++;
                } else if (typeof tindakan.opd === 'string') {
                    // Jika string, konversi ke array dengan satu elemen
                    tindakan.opd = [tindakan.opd];
                    await tindakan.save();
                    convertedCount++;
                } else if (!Array.isArray(tindakan.opd)) {
                    // Jika bukan array dan bukan string, coba konversi ke string dan masukkan ke array
                    const opdString = String(tindakan.opd);
                    tindakan.opd = [opdString];
                    await tindakan.save();
                    convertedCount++;
                } else {
                    // Sudah berbentuk array, pastikan semua elemennya string
                    const allStrings = tindakan.opd.every(item => typeof item === 'string');
                    if (!allStrings) {
                        // Jika ada elemen yang bukan string, konversi ke string
                        tindakan.opd = tindakan.opd.map(item => String(item));
                        await tindakan.save();
                        convertedCount++;
                    } else {
                        // Sudah array of string, tidak perlu konversi
                        skippedCount++;
                    }
                }
            } catch (err) {
                console.error(`Error saat memproses tindakan ID: ${tindakan._id}`, err);
                errorCount++;
            }
        }

        res.status(200).json({
            message: "Proses konversi OPD selesai",
            total: allTindakan.length,
            converted: convertedCount,
            skipped: skippedCount,
            errors: errorCount
        });
    } catch (error) {
        console.error("❌ Error converting OPD data:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server saat konversi data" });
    }
});

module.exports = router;
