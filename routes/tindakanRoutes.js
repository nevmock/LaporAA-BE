const express = require("express");
const router = express.Router();
const tindakanRepo = require("../repositories/tindakanRepo");
const reportRepo = require("../repositories/reportRepo");
const UserProfile = require("../models/UserProfile");
const { sendMessageToWhatsApp, sendEvidencePhotosToUser } = require("../controllers/messageController");
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
    const { hasil, kesimpulan, trackingId, prioritas, situasi, status, opd, disposisi, photos, url, keterangan, status_laporan } = req.body;

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
            photos,
            url,
            keterangan,
            status_laporan
        });

        // Jika Situasi Darurat Langsung Hubungi Call Center
        if (situasi === "Darurat") {
            const report = await reportRepo.findById(reportId);
            const user = await UserProfile.findById(report.user);
            const from = report.from;

            const message = `
            Terimakasih ${user.name} telah menghubungi kami.
            Karna situasi nya darurat jadi silahkan untuk langsung hubungi:

            `;

            await sendMessageToWhatsApp(from, message);

            const tindakanDarurat = await tindakanRepo.findById(tindakan._id);
            tindakanDarurat.status = "Selesai Pengaduan";
            tindakanDarurat.status_laporan = "Telah Diproses OPD Terkait";
            tindakanDarurat.kesimpulan = "Status Darurat";
            tindakanDarurat.keterangan = "Status Darurat";
            tindakanDarurat.rating = "5"
            await tindakanDarurat.save();
        }

        // Jika status diubah jadi "Selesai", kirim notifikasi WA dan minta feedback
        if (status === "Selesai Penanganan") {
            const report = await reportRepo.findById(reportId);
            const user = await UserProfile.findById(report.user);
            const from = report.from;
            const formattedKesimpulan = (tindakan.kesimpulan || [])
                .map((k, i) => `- ${k.text}`)
                .join("\n");

            const message = `
            Terimakasih ${user.name} (jenis kelaminnya ${user.jenis_kelamin}, jadi ibu / bapak / kak), Laporan ${report.sessionId} telah selesai ditangani.
            berikut ini adalah hasil penanganan laporannya:
            ${formattedKesimpulan}

            Apakah sudah puas dengan hasil penanganan laporan ini?
            jika belum puas, cukup balas dengan "belum"
            jika sudah puas, cukup balas dengan "puas"`;

            await sendEvidencePhotosToUser(tindakan.photos, from);
            await sendMessageToWhatsApp(from, message);

            // Ambil ulang tindakan untuk memastikan .save() valid
            const tindakanFromDb = await tindakanRepo.findById(tindakan._id);
            tindakanFromDb.feedbackStatus = "Sudah Ditanya";
            await tindakanFromDb.save();

            await userRepo.appendPendingFeedback(from, tindakan._id);
        }

        // Jika status diubah jadi "Ditolak", kirim notifikasi WA
        if (status === "Ditolak") {
            const report = await reportRepo.findById(reportId);
            const user = await UserProfile.findById(report.user);
            const from = report.from;

            const message = `
            Beritahu ${user.name} (jenis kelaminnya ${user.jenis_kelamin}, jadi ibu / bapak / kak), bahwa Laporan ${report.sessionId} ditolak dan tidak dapat ditindak lanjuti.
            Karena ${keterangan || "Tidak ada jalasan jelas"}, dan beritahu untuk membuat laporan baru dengan memperbaiki kesalahan ${keterangan || "Tidak ada alasan jelas, jadi langsung arahkan buat laporan baru saja"} `;

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