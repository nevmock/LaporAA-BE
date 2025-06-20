const express = require("express");
const router = express.Router();
const tindakanRepo = require("../repositories/tindakanRepo");
const reportRepo = require("../repositories/reportRepo");
const UserProfile = require("../models/UserProfile");
const { sendMessageToWhatsApp, sendEvidencePhotosToUser } = require("../controllers/messageController");
const userRepo = require("../repositories/userRepo");
const Tindakan = require("../models/Tindakan");
const tindakanResponse = require("../services/responseMessage/tindakanResponse");

// Helper: bagi teks panjang jadi beberapa pesan
function splitIntoChunks(text, maxLength) {
    const lines = text.split("\n");
    const chunks = [];
    let currentChunk = "";

    for (const line of lines) {
        if ((currentChunk + line + "\n").length > maxLength) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }
        currentChunk += line + "\n";
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

// === GET tindakan berdasarkan reportId ===
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

// === UPDATE tindakan ===
router.put("/:reportId", async (req, res) => {
    const { reportId } = req.params;
    const {
        hasil, kesimpulan, trackingId, prioritas, situasi, status,
        opd, photos, url, keterangan, status_laporan
    } = req.body;

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
            url,
            keterangan,
            status_laporan
        });

        const report = await reportRepo.findById(reportId);
        if (!report) throw new Error("Report tidak ditemukan");

        const user = await UserProfile.findById(report.user);
        const from = report.from;
        const jenisKelamin = user?.jenis_kelamin || "";
        const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";

        // === CASE DARURAT ===
        if (situasi === "Darurat") {
            const message = tindakanResponse.daruratMessage(sapaan, user.name, report.sessionId);
            await sendMessageToWhatsApp(from, message);

            const tindakanDarurat = await tindakanRepo.findById(tindakan._id);
            tindakanDarurat.status = "Selesai Pengaduan";
            tindakanDarurat.status_laporan = "Telah Diproses OPD Terkait";
            tindakanDarurat.kesimpulan = [{ text: "Status Darurat" }];
            tindakanDarurat.keterangan = "Status Darurat";
            tindakanDarurat.rating = "5";
            await tindakanDarurat.save();
        }

        // === CASE SELESAI ===
        if (status === "Selesai Penanganan") {
            const formattedKesimpulan = (tindakan.kesimpulan || []).map(k => `- ${k.text}`).join("\n");
            const chunks = splitIntoChunks(formattedKesimpulan, 2500);

            await sendEvidencePhotosToUser(tindakan.photos, from);

            const openingMessage = tindakanResponse.selesaiPenangananMessage(
                sapaan, user.name, report.sessionId, chunks[0]
            );
            await sendMessageToWhatsApp(from, openingMessage);

            for (let i = 1; i < chunks.length; i++) {
                await sendMessageToWhatsApp(from, chunks[i]);
            }

            const tindakanFromDb = await tindakanRepo.findById(tindakan._id);
            tindakanFromDb.feedbackStatus = "Sudah Ditanya";
            await tindakanFromDb.save();
            await userRepo.appendPendingFeedback(from, tindakan._id);
        }

        // === CASE SELESAI OTOMATIS SETELAH REPROCESS ===
        if (status === "Proses OPD Terkait" && tindakan.hasBeenReprocessed) {
            tindakan.status = "Selesai Pengaduan";
            tindakan.feedbackStatus = "Auto Rated";
            tindakan.rating = 5;
            await tindakan.save();

            const message = tindakanResponse.finalizeAndAskNewReport(sapaan, user.name);
            await sendMessageToWhatsApp(from, message);
            await userRepo.removePendingFeedback(from, tindakan._id);
        }

        // === CASE Ditutup ===
        if (status === "Ditutup") {
            const message = tindakanResponse.DitutupMessage(sapaan, user.name, report.sessionId, keterangan);
            await sendMessageToWhatsApp(from, message);
        }

        res.status(200).json(tindakan);
    } catch (error) {
        console.error("Error updating action:", error);
        res.status(500).json({ message: error.message || "Terjadi kesalahan pada server" });
    }
});

// === PATCH prioritas ===
router.patch("/:reportId/prioritas", async (req, res) => {
    const { reportId } = req.params;
    const { prioritas } = req.body;

    try {
        const tindakan = await Tindakan.findOne({ report: reportId });
        if (!tindakan) return res.status(404).json({ message: "Tindakan tidak ditemukan" });

        tindakan.prioritas = prioritas;
        tindakan.updatedAt = new Date();
        await tindakan.save();

        res.status(200).json(tindakan);
    } catch (error) {
        console.error("Error updating prioritas:", error);
        res.status(500).json({ message: error.message });
    }
});

// === POST tambah kesimpulan ===
router.post("/:id/kesimpulan", async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.status(400).json({ message: "Teks kesimpulan tidak boleh kosong" });
    }

    try {
        const updated = await tindakanRepo.appendKesimpulan(id, text.trim());
        const tindakan = await tindakanRepo.findById(id);
        const report = await reportRepo.findById(tindakan.report);
        const user = await UserProfile.findById(report.user);
        const from = report.from;

        const jenisKelamin = user?.jenis_kelamin || "";
        const sapaan = jenisKelamin.toLowerCase() === "pria" ? "Pak" : jenisKelamin.toLowerCase() === "wanita" ? "Bu" : "";
        const latestKesimpulan = updated.kesimpulan?.[updated.kesimpulan.length - 1];

        const message = tindakanResponse.tindakLanjutLaporanMessage(
            sapaan, user.name, report.sessionId, report.message, latestKesimpulan
        );
        await sendMessageToWhatsApp(from, message);

        res.status(200).json(updated);
    } catch (error) {
        console.error("Error menambahkan kesimpulan:", error);
        res.status(500).json({ message: error.message });
    }
});

// === PUT edit kesimpulan ===
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

// === DELETE kesimpulan ===
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

// === DELETE tindakan ===
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
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;