const effectivenessRepo = require("../repositories/effectivenessRepo");

async function calculateEffectiveness() {
    const diverifikasi = await effectivenessRepo.countDiverifikasi();
    const selesai = await effectivenessRepo.countSelesai();

    const value = selesai > 0 ? (selesai / diverifikasi) * 100 : 0;

    return {
        value,
        updated_at: new Date().toISOString()
    };
}

module.exports = {
    calculateEffectiveness
};
