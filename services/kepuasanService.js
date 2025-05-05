const kepuasanRepo = require("../repositories/kepuasanRepo");

async function calculateKepuasan() {
    const ratingDocs = await kepuasanRepo.getRatings();
    const ratings = ratingDocs.map(doc => doc.rating);

    const total = ratings.reduce((sum, val) => sum + val, 0);
    const average = ratings.length > 0 ? total / ratings.length : 0;

    // Ubah ke persentase
    const percentage = (average / 5) * 100;

    return {
        value: percentage,
        updated_at: new Date().toISOString()
    };
}

module.exports = {
    calculateKepuasan
};