const botFlowResponse = require("../responseMessage/botFlowResponse");
const tindakanRepo = require("../../repositories/tindakanRepo");

module.exports = async function ratingHandler({ from, input, session, sapaan, nama, sendReply }) {
    const rating = parseInt(input);
    const tindakanId = session.pendingFeedbackFor?.[0];

    if (isNaN(rating) || rating < 1 || rating > 5) {
        return sendReply(from, botFlowResponse.ratingInvalid(sapaan, nama));
    }

    try {
        const tindakan = await tindakanRepo.findById(tindakanId);
        if (!tindakan) {
            return sendReply(from, botFlowResponse.laporanTidakDitemukan(sapaan, nama));
        }

        tindakan.rating = rating;
        await tindakan.save();

        session.pendingFeedbackFor = session.pendingFeedbackFor.filter(id => id.toString() !== tindakanId.toString());
        session.step = "MAIN_MENU";
        session.currentAction = null;
        await session.save();

        return sendReply(from, botFlowResponse.ratingSuccess(sapaan, nama, rating));
    } catch (err) {
        console.error("Gagal menyimpan rating:", err);
        return sendReply(from, botFlowResponse.gagalSimpanRating());
    }
};
