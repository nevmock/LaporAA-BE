const UserProfile = require("../models/UserProfile");

exports.findByFrom = async (from) => {
  return await UserProfile.findOne({ from });
};

exports.create = async ({ from, name, nik, address }) => {
  return await UserProfile.create({ from, name, nik, address });
};

exports.appendToReportHistory = async (from, sessionId) => {
  return await UserProfile.findOneAndUpdate(
    { from },
    { $push: { reportHistory: sessionId } },
    { new: true }
  );
};
