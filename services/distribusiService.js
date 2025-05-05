const distribusiRepo = require("../repositories/distribusiRepo");

function hitungStdDev(values) {
    const n = values.length;
    if (n === 0) return { stdDev: 0, mean: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    return { stdDev, mean };
}

async function calculateDistribusi() {
    const lokasiCounts = await distribusiRepo.getLaporanSelesaiPerKoordinat();
    const values = lokasiCounts.map(item => item.jumlah);

    const { stdDev, mean } = hitungStdDev(values);

    // Normalisasi ke bentuk persentase
    const normalized = mean > 0 ? (stdDev / mean) * 100 : 0;

    return {
        value: normalized,
        updated_at: new Date().toISOString()
    };
}

module.exports = {
    calculateDistribusi
};
