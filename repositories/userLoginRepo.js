const UserLogin = require("../models/UserLogin");

module.exports = {
    findAll: () => UserLogin.find(),
    findById: (id) => UserLogin.findById(id),
    findByUsername: (username) => UserLogin.findOne({ username }),
    create: (data) => UserLogin.create(data),
    update: (id, data) => UserLogin.findByIdAndUpdate(id, data, { new: true }),
    delete: (id) => UserLogin.findByIdAndDelete(id)
};