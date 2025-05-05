const Tindakan = require("../models/Tindakan");

async function getRatings() {
    return await Tindakan.find(
        {
            rating: { $ne: null },
            status: "Selesai Pengaduan"
        },
        "rating"
    ).lean();    
}

module.exports = {
    getRatings
};