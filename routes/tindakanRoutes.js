const express = require("express");
const router = express.Router();
const tindakanRepo = require("../repositories/tindakanRepo");
const reportRepo = require("../repositories/reportRepo");
const UserProfile = require("../models/UserProfile");
const { sendMessageToWhatsApp } = require("../controllers/messageController");
const userRepo = require("../repositories/userRepo");
const Tindakan = require("../models/Tindakan");

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
    const { hasil, kesimpulan, trackingId, prioritas, situasi, status, opd, disposisi, photos } = req.body;

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
            disposisi,
            photos
        });

        // Jika status diubah jadi "Selesai", kirim notifikasi WA dan minta feedback
        if (status === "Selesai Penanganan") {
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

        // Jika status diubah jadi "Ditolak", kirim notifikasi WA
        if (status === "Ditolak") {
            const report = await reportRepo.findById(reportId);
            const user = await UserProfile.findById(report.user);
            const from = report.from;

            const message = `❌ *Laporan ${report.sessionId} ditolak dan tidak dapat ditindaklanjuti.*\n\n` +
                `📌 *Alasan Penolakan:* ${kesimpulan || "-"}\n\n` +
                `Terima kasih atas partisipasinya.`;

            await sendMessageToWhatsApp(from, message);

            // Tidak perlu masukkan ke pendingFeedback karena sudah final
        }

        res.status(200).json(tindakan);
    } catch (error) {
        console.error("Error updating action:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.patch("/:reportId/prioritas", async (req, res) => {
    const { reportId } = req.params;
    const { prioritas } = req.body;

    try {
        const tindakan = await Tindakan.findOne({ report: reportId }); // langsung akses model
        if (!tindakan) return res.status(404).json({ message: "Tindakan tidak ditemukan" });

        tindakan.prioritas = prioritas;
        tindakan.updatedAt = new Date();
        await tindakan.save();

        res.status(200).json(tindakan);
    } catch (error) {
        console.error("Error updating prioritas:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.post("/:id/kesimpulan", async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ message: "Teks kesimpulan tidak boleh kosong" });
    }

    try {
        const updated = await tindakanRepo.appendKesimpulan(id, text.trim());
        res.status(200).json(updated);
    } catch (error) {
        console.error("Error menambahkan kesimpulan:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

router.put("/:id/kesimpulan/:index", async (req, res) => {
    const { id, index } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ message: "Teks kesimpulan tidak boleh kosong" });
    }

    try {
        const updated = await tindakanRepo.updateKesimpulanByIndex(id, parseInt(index), text.trim());
        res.status(200).json(updated);
    } catch (error) {
        console.error("Error update kesimpulan:", error);
        res.status(500).json({ message: error.message });
    }
});

router.delete("/:id/kesimpulan/:index", async (req, res) => {
    const { id, index } = req.params;

    try {
        const updated = await tindakanRepo.deleteKesimpulanByIndex(id, parseInt(index));
        res.status(200).json(updated);
    } catch (error) {
        console.error("Error delete kesimpulan:", error);
        res.status(500).json({ message: error.message });
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