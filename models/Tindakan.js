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
        type: [
            {
                text: String,
                timestamp: { type: Date, default: Date.now }
            }
        ],
        default: [],
    },       
    trackingId: {
        type: Number,
        default: null,
    },
    prioritas: {
        type: String,
        enum: ["Ya", "-"],
        default: null,
    },
    situasi: {
        type: String,
        enum: ["", "Darurat", "Permintaan Informasi", "Berpengawasan", "Tidak Berpengawasan"],
        default: "",
    },
    status: {
        type: String,
        enum: ["Perlu Verifikasi", "Verifikasi Situasi", "Verifikasi Kelengkapan Berkas", "Proses OPD Terkait", "Selesai Penanganan", "Selesai Pengaduan", "Ditutup"],
        default: "Perlu Verifikasi",
        index: true
    },
    tag: {
        type: [
            {
                hash_tag: String,
            }
        ],
        default: [],
    },
    opd: {
        type: [String],
        default: [],
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
        enum: ["Belum Ditanya", "Sudah Ditanya", "Sudah Jawab Beres", "Sudah Jawab Belum Beres", "Selesai Ditutup", "Auto Rated"],
        default: null,
        index: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
        index: true
    },
    url: {
        type: String,
        default: null
    },
    keterangan: {
        type: String,
        default: null
    },
    status_laporan: {
        type: String,
        enum: ["Menunggu Diproses OPD Terkait", "Sedang Diproses OPD Terkait", "Telah Diproses OPD Terkait"],
        default: "Menunggu Diproses OPD Terkait",
    },
    hasBeenReprocessed: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("Tindakan", actionSchema);
