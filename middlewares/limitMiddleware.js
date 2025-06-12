const moment = require('moment');
const Report = require('../models/Report');
const LimitLog = require('../models/LimitLog');
const { limitResponse } = require('../services/responseMessage/botFlowResponse');
const sendReply = require('../controllers/messageController');

const limitMiddleware = async (req, res, next) => {
    try {
        const value = req.body?.entry?.[0]?.changes?.[0]?.value;

        // Filter hanya jika ada messages array
        const messages = value?.messages;
        if (!messages || !Array.isArray(messages)) {
            console.info('No valid message found, skipping...');
            return res.sendStatus(200);
        }

        const message = messages[0];

        // Filter hanya pesan teks
        if (message.type !== 'text') {
            console.info('Non-text message received, skipping...');
            return res.sendStatus(200);
        }

        const from = message.from;
        const todayStart = moment().startOf('day').toDate();

        const reportCount = await Report.countDocuments({ createdAt: { $gte: todayStart } });
        console.info('Total Report Today:', reportCount);
        console.info('Phone Number:', from);

        if (reportCount >= (process.env.MAX_REPORT_PER_DAY || 500)) {
            // Cek apakah user ini sudah dikirimi balasan limit hari ini
            const alreadyWarned = await LimitLog.findOne({ phoneNumber: from, date: todayStart });
            if (alreadyWarned) {
                console.info('User already warned today. Skipping reply...');
                return res.sendStatus(200);
            }

            // Simpan log supaya besok bisa dibalas ulang
            await LimitLog.create({ phoneNumber: from, date: todayStart });

            console.warn('Report limit reached for today');
            await sendReply.sendMessageToWhatsApp(from, limitResponse());
            return res.status(429).send('Report limit reached for today');
        }

        next();
    } catch (error) {
        console.error('Error in limitMiddleware:', error);
        return res.status(500).send('Internal Server Error');
    }
};

module.exports = limitMiddleware;
