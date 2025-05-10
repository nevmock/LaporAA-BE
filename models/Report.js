const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
    },
    from: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserProfile",
        required: true,
    },
    location: {
        type: {
            type: String, // "map" (share location) atau "text" (manual)
            enum: ["map", "text"],
            required: true
        },
        latitude: {
            type: Number,
            required: function () {
                return this.type === "map";
            }
        },
        longitude: {
            type: Number,
            required: function () {
                return this.type === "map";
            }
        },
        description: {
            type: String,
            required: true
        },
        desa: {
            type: String,
            default: "-"
        },
        kecamatan: {
            type: String,
            default: "-"
        },
        kabupaten: {
            type: String,
            default: "-"
        }
    },
    message: {
        type: String,
        required: true,
    },
    photos: {
        type: [String],
        default: [],
    },
    tindakan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tindakan",
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model("Report", reportSchema);