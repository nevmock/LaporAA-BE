const UserSession = require("../models/UserSession");

exports.getOrCreateSession = async (from) => {
    let session = await UserSession.findOne({ from });
    if (!session) {
        session = await UserSession.create({
            from,
            currentAction: null,
            step: "MAIN_MENU",
            data: {},
        });
    }
    return session;
};

exports.updateSession = async (from, updates = {}) => {
    return await UserSession.findOneAndUpdate({ from }, updates, { new: true });
};

exports.clearSession = async (from) => {
    return await UserSession.deleteOne({ from });
};

exports.setBotMode = async (from, mode = "bot") => {
    return await UserSession.findOneAndUpdate({ from }, { mode }, { new: true });
};

exports.getActiveSession = async (from) => {
    return await UserSession.findOne({ from, status: "in_progress" });
};

exports.appendPendingFeedback = async (from, tindakanId) => {
    await UserSession.updateOne(
        { from },
        { $addToSet: { pendingFeedbackFor: tindakanId } } // hindari duplikat
    );
};

exports.resetSession = async (from) => {
    return await UserSession.findOneAndUpdate(
        { from },
        {
            currentAction: null,
            step: "MAIN_MENU",
            data: {},
            status: "in_progress"
        },
        { new: true }
    );
};


