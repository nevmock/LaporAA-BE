
const moment = require('moment');
// Adjust the path below to where your UserSession model is located
const UserSession = require('../models/UserSession');

const limitMiddleware = async (req, res, next) => {
    try {
        const today = moment().startOf('day');
        const userSessions = await UserSession.find({
            createdAt: { $gte: today.toDate() }
        });
        // Your business logic goes here
        console.log(userSessions?.length); // For debugging purposes
        next();
    } catch (error) {
        console.error("Error fetching UserSessions:", error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = limitMiddleware;
