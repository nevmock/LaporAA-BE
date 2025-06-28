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

exports.appendPendingFeedbacks = async (from, tindakanIds) => {
    await UserSession.updateOne(
        { from },
        { $addToSet: { pendingFeedbackFor: { $each: tindakanIds } } } // hindari duplikat
    );
};

exports.removePendingFeedback = async (from, tindakanId) => {
    await UserSession.updateOne(
        { from },
        { $pull: { pendingFeedbackFor: tindakanId } } // hapus tindakanId dari array
    );
};

// Set force mode manual (saklar utama)
exports.setForceMode = async (from, force) => {
    let session = await UserSession.findOne({ from });

    if (!session) {
        session = await UserSession.create({
            from,
            currentAction: null,
            step: "MAIN_MENU",
            data: {},
            forceModeManual: force,
            mode: force ? 'manual' : 'bot',
            manualModeUntil: null
        });
    } else {
        session.forceModeManual = force;

        if (force) {
            // Jika forceModeManual diaktifkan, set mode ke manual dan clear timeout
            session.mode = 'manual';
            session.manualModeUntil = null;
        } else {
            // Jika forceModeManual dimatikan, mode bisa dikembalikan ke bot
            // Kecuali jika masih ada manual mode timeout yang aktif
            if (!session.manualModeUntil || new Date() > session.manualModeUntil) {
                session.mode = 'bot';
                session.manualModeUntil = null;
            }
        }

        await session.save();
    }

    return session;
};

// Get effective mode untuk user
exports.getEffectiveMode = async (from) => {
    const session = await UserSession.findOne({ from });
    if (!session) return 'bot'; // default mode
    return session.getEffectiveMode();
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


