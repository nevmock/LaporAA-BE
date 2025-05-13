const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    nik: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    jenis_kelamin: {
        type: String,
        required: true,
    },
    reportHistory: {
        type: [String], // Array of sessionId
        default: [],
    }      
}, {
    timestamps: true, // createdAt & updatedAt
});

module.exports = mongoose.model("UserProfile", userProfileSchema);
