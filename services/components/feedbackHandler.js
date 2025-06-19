const botFlowResponse = require("../responseMessage/botFlowResponse");
const tindakanRepo = require("../../repositories/tindakanRepo");
const tindakanResponse = require("../responseMessage/tindakanResponse");

module.exports = async function feedbackHandler({ from, input, session, sapaan, nama, sendReply }) {
    const tindakanId = session.pendingFeedbackFor[0];
    const tindakan = await tindakanRepo.findById(tindakanId);

    if (tindakan?.status === "Ditutup" && tindakan.feedbackStatus === "Sudah Ditanya") {
        tindakan.feedbackStatus = "Selesai Ditutup";
        await tindakan.save();

        session.pendingFeedbackFor.shift();
        session.step = "MAIN_MENU";
        await session.save();

        const sessionId = tindakan.report?.sessionId || "Tidak diketahui";
        return sendReply(from, botFlowResponse.laporanDitutup(sapaan, nama, sessionId, tindakan.kesimpulan));
    }

    if (["puas", "belum"].includes(input)) {
        const sessionId = tindakan.report?.sessionId || "Tidak diketahui";

        if (tindakan?.status === "Selesai Penanganan" && tindakan.feedbackStatus === "Sudah Ditanya") {
            let reply;

            if (input === "puas") {
                tindakan.feedbackStatus = "Sudah Jawab Beres";
                tindakan.status = "Selesai Pengaduan";
                await tindakan.save();

                session.step = "WAITING_FOR_RATING";
                await session.save();

                reply = botFlowResponse.puasReply(sapaan, nama, sessionId);
            } else {
                if (!tindakan.hasBeenReprocessed) {
                    tindakan.feedbackStatus = "Sudah Jawab Belum Beres";
                    tindakan.status = "Proses OPD Terkait";
                    tindakan.hasBeenReprocessed = true;
                    await tindakan.save();

                    session.pendingFeedbackFor.shift();
                    session.step = "MAIN_MENU";
                    await session.save();

                    reply = botFlowResponse.belumReply(sapaan, nama, sessionId, session.pendingFeedbackFor.length);
                } else {
                    tindakan.feedbackStatus = "Sudah Jawab Beres";
                    tindakan.status = "Selesai Pengaduan";
                    tindakan.rating = 5;
                    await tindakan.save();

                    session.pendingFeedbackFor.shift();
                    session.step = "MAIN_MENU";
                    await session.save();

                    reply = tindakanResponse.finalizeAndAskNewReport(sapaan, nama);
                }
            }

            return sendReply(from, reply);
        }
    }

    return sendReply(from, botFlowResponse.pendingKonfirmasi(sapaan, nama));
};