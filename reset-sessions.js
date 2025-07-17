const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI);

// Import models
const UserProfile = require('./models/UserProfile');

async function resetActiveReportSessions() {
    try {
        console.log('🔄 Resetting active report sessions...');
        
        // Find users with active sessions in report creation
        const activeUsers = await UserProfile.find({
            'session.step': { $exists: true, $ne: null }
        });
        
        console.log(`📊 Found ${activeUsers.length} users with active sessions`);
        
        for (const user of activeUsers) {
            console.log(`🔄 Resetting session for user: ${user.from} (step: ${user.session.step})`);
            await UserProfile.findByIdAndUpdate(user._id, {
                $unset: { session: 1 }
            });
        }
        
        console.log('✅ All active sessions reset');
        process.exit(0);
    } catch (error) {
        console.error('❌ Reset failed:', error);
        process.exit(1);
    }
}

resetActiveReportSessions();
