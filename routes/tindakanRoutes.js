const express = require("express");
const router = express.Router();
const tindakanRepo = require("../repositories/tindakanRepo");
const reportRepo = require("../repositories/reportRepo");
const UserProfile = require("../models/UserProfile");
const { sendMessageToWhatsApp } = require("../controllers/messageController");
const userRepo = require("../repositories/userRepo");

// GET tindakan berdasarkan reportId
router.get("/:reportId", async (req, res) => {
    const { reportId } = req.params;

    try {
        const tindakan = await tindakanRepo.findByReportId(reportId);

        if (!tindakan || tindakan.length === 0) {
            return res.status(404).json({ message: "Tidak ada tindakan yang ditemukan untuk laporan ini" });
        }

        res.status(200).json(tindakan);
    } catch (error) {
        console.error("Error fetching actions:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// UPDATE tindakan
router.put("/:reportId", async (req, res) => {
    const { reportId } = req.params;
    const { hasil, kesimpulan, trackingId, prioritas, situasi, status, opd, photos } = req.body;

    try {
        const tindakan = await tindakanRepo.update({
            reportId,
            hasil,
            kesimpulan,
            trackingId,
            prioritas,
            situasi,
            status,
            opd,
            photos,
        });

        // Jika status diubah jadi "Selesai", kirim notifikasi WA dan minta feedback
        if (status === "Selesai Penannganan") {
            const report = await reportRepo.findById(reportId);
            const user = await UserProfile.findById(report.user);
            const from = report.from;
        
            const message = `📝 *Laporan ${report.sessionId} telah ditangani.*\n\n` +
                `📌 *Kesimpulan:* ${kesimpulan || "-"}\n` +
                `🏢 *OPD Terkait:* ${opd || "-"}\n` +
                `📅 *Status:* ${status}\n\n` +
                `Apakah Anda sudah puas dengan penanganan ini?\n` +
                `Balas *ya* jika puas, atau *belum* jika masih perlu ditindaklanjuti ulang.`;
        
            await sendMessageToWhatsApp(from, message);
        
            // Ambil ulang tindakan untuk memastikan .save() valid
            const tindakanForFeedback = await tindakanRepo.findById(tindakan._id);
            tindakanForFeedback.feedbackStatus = "Sudah Ditanya";
            await tindakanForFeedback.save();
        
            await userRepo.appendPendingFeedback(from, tindakan._id);
        }        

        res.status(200).json(tindakan);
    } catch (error) {
        console.error("Error updating action:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// DELETE tindakan
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const deletedTindakan = await tindakanRepo.delete(id);

        if (!deletedTindakan) {
            return res.status(404).json({ message: "Tindakan tidak ditemukan" });
        }

        res.status(200).json({ message: "Tindakan berhasil dihapus" });
    } catch (error) {
        console.error("Error deleting action:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

module.exports = router;