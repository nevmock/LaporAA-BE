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