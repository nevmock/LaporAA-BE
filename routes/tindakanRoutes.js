const express = require("express");
const router = express.Router();
const tindakanRepo = require("../repositories/tindakanRepo");
const reportRepo = require("../repositories/reportRepo");
const UserProfile = require("../models/UserProfile");
const { sendMessageToWhatsApp, sendEvidencePhotosToUser } = require("../controllers/messageController");
const userRepo = require("../repositories/userRepo");
const Tindakan = require("../models/Tindakan");
const tindakanResponse = require("../services/responseMessage/tindakanResponse");
const { validateOpdMiddleware } = require("../middlewares/opdValidationMiddleware");

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
router.put("/:reportId", validateOpdMiddleware, async (req, res) => {
    const { reportId } = req.params;
    const {
        hasil, kesimpulan, trackingId, prioritas, situasi, status,
        opd, photos, url, keterangan, status_laporan, tag
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
            status_laporan,
            tag
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

        // === CASE SELESAI PENANGANAN ===
        if (status === "Selesai Penanganan") {
            // Jika sudah pernah di-reprocess, langsung finalisasi tanpa minta feedback
            if (tindakan.hasBeenReprocessed) {
                tindakan.status = "Selesai Pengaduan";
                tindakan.feedbackStatus = "Auto Rated";
                tindakan.rating = 5;
                await tindakan.save();

                const message = tindakanResponse.finalizeAndAskNewReport(sapaan, user.name);
                await sendMessageToWhatsApp(from, message);
                await userRepo.removePendingFeedback(from, tindakan._id);
            } else {
                // Proses normal: kirim kesimpulan dan minta feedback
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

// PATCH /report/:id/processed-by
router.patch("/:id/processed-by", async (req, res) => {
    const { id } = req.params;
    const { userLoginId } = req.body; // Ini harus _id_ dari UserLogin

    if (!userLoginId) {
        return res.status(400).json({ message: "UserLogin ID diperlukan" });
    }

    try {
        const updated = await reportRepo.updateProcessedBy(id, userLoginId);
        if (!updated) {
            return res.status(404).json({ message: "Report tidak ditemukan" });
        }
        res.status(200).json(updated);
    } catch (err) {
        console.error("Error update processed_by:", err);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
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

// === TAG MANAGEMENT ROUTES ===

// Add a tag to tindakan
router.post("/:tindakanId/tag", async (req, res) => {
    try {
        const { tindakanId } = req.params;
        const { hash_tag } = req.body;
        
        if (!hash_tag) {
            return res.status(400).json({ message: "Tag tidak boleh kosong" });
        }
        
        const updatedTindakan = await tindakanRepo.addTag(tindakanId, hash_tag);
        
        res.status(200).json({ 
            message: "Tag berhasil ditambahkan",
            tindakan: updatedTindakan
        });
    } catch (error) {
        console.error("Error adding tag:", error);
        
        if (error.message === "Tindakan tidak ditemukan.") {
            return res.status(404).json({ message: error.message });
        }
        
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// Remove a tag from tindakan
router.delete("/:tindakanId/tag/:hashTag", async (req, res) => {
    try {
        const { tindakanId, hashTag } = req.params;
        
        const updatedTindakan = await tindakanRepo.removeTag(tindakanId, hashTag);
        
        res.status(200).json({ 
            message: "Tag berhasil dihapus",
            tindakan: updatedTindakan
        });
    } catch (error) {
        console.error("Error removing tag:", error);
        
        if (error.message === "Tindakan tidak ditemukan.") {
            return res.status(404).json({ message: error.message });
        }
        
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// Update all tags for a tindakan
router.put("/:tindakanId/tags", async (req, res) => {
    try {
        const { tindakanId } = req.params;
        const { tags } = req.body;
        
        if (!Array.isArray(tags)) {
            return res.status(400).json({ message: "Tags harus berupa array" });
        }
        
        const updatedTindakan = await tindakanRepo.updateTags(tindakanId, tags);
        
        res.status(200).json({ 
            message: "Tags berhasil diperbarui",
            tindakan: updatedTindakan
        });
    } catch (error) {
        console.error("Error updating tags:", error);
        
        if (error.message === "Tindakan tidak ditemukan.") {
            return res.status(404).json({ message: error.message });
        } else if (error.message.includes("Format tag tidak valid")) {
            return res.status(400).json({ message: error.message });
        }
        
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// Get all unique tags in the system
router.get("/tags/all", async (req, res) => {
    try {
        const tags = await tindakanRepo.findAllUniqueTags();
        
        res.status(200).json({ 
            totalTags: tags.length,
            tags: tags
        });
    } catch (error) {
        console.error("Error fetching tags:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// Search for tags matching a query string (for autocomplete)
router.get("/tags/search", async (req, res) => {
    try {
        const query = req.query.q || '';
        const tags = await tindakanRepo.searchTags(query);
        
        res.status(200).json({ 
            query: query,
            totalResults: tags.length,
            tags: tags
        });
    } catch (error) {
        console.error("Error searching tags:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

// Get tindakan by tag
router.get("/tags/:hashTag", async (req, res) => {
    try {
        const { hashTag } = req.params;
        
        const tindakan = await tindakanRepo.findByTag(hashTag);
        
        if (!tindakan || tindakan.length === 0) {
            return res.status(404).json({ message: "Tidak ada tindakan dengan tag tersebut" });
        }
        
        res.status(200).json({ 
            totalResults: tindakan.length,
            hashTag: hashTag,
            tindakan: tindakan
        });
    } catch (error) {
        console.error("Error searching by tag:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

module.exports = router;