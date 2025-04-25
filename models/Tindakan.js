const mongoose = require("mongoose");

const actionSchema = new mongoose.Schema({
    report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report", // Referensi ke laporan terkait
        required: true,
    },
    hasil: {
        type: String, // Penjelasan hasil tindakan
        default: "",
    },
    kesimpulan: {
        type: String, // Kesimpulan atau rekomendasi tindakan
        default: "",
    },
    trackingId: {
        type: Number,
        default: null,
    },
    prioritas: {
        type: String,
        enum: ["Ya", "Tidak"],
        default: null,
    },
    situasi: {
        type: String,
        enum: ["Darurat", "Permintaan Informasi", "Berpengawasan", "Tidak Berpengawasan"],
        default: null,
    },
    status: {
        type: String,
        enum: ["Perlu Verifikasi", "Verifikasi Kelengkapan Berkas", "Proses OPD Terkait", "Selesai Penanganan", "Selesai Pengaduan"],
        default: "Perlu Verifikasi",
    },
    opd: {
        type: String,
        default: "",
    },
    photos: {
        type: [String], // URL foto (kalau pakai upload ke cloud)
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    feedbackStatus: {
        type: String,
        enum: ["Belum Ditanya", "Sudah Ditanya", "Sudah Jawab Beres", "Sudah Jawab Belum Beres"],
        default: null,
    }   
});

module.exports = mongoose.model("Tindakan", actionSchema);