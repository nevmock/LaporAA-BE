const tindakanRepo = require("../repositories/tindakanRepo");
const reportRepo = require("../repositories/reportRepo");

async function autoCloseFeedback() {
    const tindakanList = await tindakanRepo.findAll({
        status: "Selesai Penanganan",
        rating: { $exists: false },
        feedbackStatus: "Sudah Ditanya"
    });

    for (const tindakan of tindakanList) {
        tindakan.rating = 5;
        tindakan.status = "Selesai Pengaduan";
        tindakan.feedbackStatus = "Auto Rated";
        await tindakan.save();

        const report = await reportRepo.findById(tindakan.report);
        if (report) {
            report.status = "Selesai Pengaduan";
            await report.save();
        }

        console.log(`✅ Auto-closed tindakan ${tindakan._id} with 5⭐`);
    }
}

module.exports = autoCloseFeedback;