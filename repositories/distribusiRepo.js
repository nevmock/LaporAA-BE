const Tindakan = require("../models/Tindakan");

const selesaiStatuses = ["Selesai Penanganan", "Selesai Pengaduan"];

async function getLaporanSelesaiPerKoordinat() {
    const data = await Tindakan.aggregate([
        {
            $match: { status: { $in: selesaiStatuses } }
        },
        {
            $lookup: {
                from: "reports",
                localField: "report",
                foreignField: "_id",
                as: "reportData"
            }
        },
        { $unwind: "$reportData" },
        {
            $group: {
                _id: {
                    lat: "$reportData.location.latitude",
                    lng: "$reportData.location.longitude"
                },
                jumlah: { $sum: 1 }
            }
        }
    ]);

    return data;
}

module.exports = {
    getLaporanSelesaiPerKoordinat
};