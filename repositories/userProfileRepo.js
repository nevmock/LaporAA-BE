const UserProfile = require("../models/UserProfile");
const Report = require("../models/Report");
const Tindakan = require("../models/Tindakan");
const UserSession = require("../models/UserSession");

exports.findByFrom = async (from) => {
  return await UserProfile.findOne({ from });
};

exports.create = async ({ from, name, jenis_kelamin }) => {
  return await UserProfile.create({ from, name, jenis_kelamin });
};

exports.appendToReportHistory = async (from, sessionId) => {
  return await UserProfile.findOneAndUpdate(
    { from },
    { $push: { reportHistory: sessionId } },
    { new: true }
  );
};

exports.deleteUserByFrom = async (from) => {
  const profile = await UserProfile.findOne({ from });
  if (!profile) throw new Error("UserProfile not found");

  // Hapus semua laporan yang dibuat user
  const reports = await Report.find({ from });
  for (const report of reports) {
    // Hapus tindakan terkait
    if (report.tindakan) {
      await Tindakan.deleteOne({ _id: report.tindakan });
    }
    await Report.deleteOne({ _id: report._id });
  }

  // Hapus session user
  await UserSession.deleteOne({ from });

  // Hapus profil user
  await UserProfile.deleteOne({ from });

  return { message: "User dan seluruh data terkait telah dihapus." };
};

// Get report history for a user by 'from'
async function getReportHistoryByFrom(from) {
    return await UserProfile.findOne({ from }, { reportHistory: 1, _id: 0 });
}

// Add a report to user's reportHistory
async function addReportToHistory(from, sessionId) {
    return await UserProfile.findOneAndUpdate(
        { from },
        { $addToSet: { reportHistory: sessionId } },
        { new: true }
    );
}

// Get all reports (with status) for a user by 'from'
async function getAllReportsWithStatusByFrom(from) {
    // Find all reports by 'from'
    const reports = await Report.find({ from })
        .populate({
            path: "tindakan",
            select: "status"
        })
        .select("sessionId createdAt updatedAt tindakan");
    // Map to include status
    return reports.map(r => ({
        sessionId: r.sessionId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        status: r.tindakan ? r.tindakan.status : "Belum Ditindaklanjuti"
    }));
}

// Bulk sync: masukkan semua report ke reportHistory setiap user
async function bulkSyncReportHistoryForAllUsers() {
    const allUsers = await UserProfile.find({});
    let updatedCount = 0;
    for (const user of allUsers) {
        const reports = await Report.find({ from: user.from }).select("sessionId");
        const sessionIds = reports.map(r => r.sessionId);
        if (sessionIds.length > 0) {
            await UserProfile.updateOne(
                { _id: user._id },
                { $addToSet: { reportHistory: { $each: sessionIds } } }
            );
            updatedCount++;
        }
    }
    return { updated: updatedCount, total: allUsers.length };
}

module.exports = {
    findByFrom,
    create,
    appendToReportHistory,
    deleteUserByFrom,
    getReportHistoryByFrom,
    addReportToHistory,
    getAllReportsWithStatusByFrom,
    bulkSyncReportHistoryForAllUsers
};