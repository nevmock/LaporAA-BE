const efisiensiRepo = require("../repositories/efisiensiRepo");

async function calculateEfisiensi() {
    const totalReports = await efisiensiRepo.countAllReports();
    const verifiedTindakans = await efisiensiRepo.countVerifiedTindakans();

    const value = verifiedTindakans > 0 ? (verifiedTindakans / totalReports ) * 100 : 0;

    return {
        value,
        updated_at: new Date().toISOString()
    };
}

module.exports = {
    calculateEfisiensi
};
