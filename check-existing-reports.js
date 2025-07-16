const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI);

// Import Report model
const Report = require('./models/Report');

async function checkExistingReports() {
    try {
        console.log('🔍 Checking existing reports with old photos structure...');
        
        // Find reports that might have old photos structure
        const reportsWithPhotos = await Report.find({ 
            photos: { $exists: true, $not: { $size: 0 } } 
        }).limit(5);
        
        console.log(`📊 Found ${reportsWithPhotos.length} reports with photos`);
        
        for (let i = 0; i < reportsWithPhotos.length; i++) {
            const report = reportsWithPhotos[i];
            console.log(`\n📋 Report ${i + 1} (${report.sessionId}):`);
            console.log('Photos structure:', typeof report.photos[0]);
            
            if (typeof report.photos[0] === 'string') {
                console.log('⚠️ Old structure detected (array of strings)');
                console.log('Sample photo:', report.photos[0]);
            } else {
                console.log('✅ New structure (array of objects)');
                console.log('Sample photo:', JSON.stringify(report.photos[0], null, 2));
            }
        }
        
        const oldStructureCount = await Report.countDocuments({
            'photos.0': { $type: 'string' }
        });
        
        console.log(`\n📊 Reports with old structure: ${oldStructureCount}`);
        
        if (oldStructureCount > 0) {
            console.log('⚠️ Migration needed for old reports');
        } else {
            console.log('✅ All reports have compatible structure');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Check failed:', error);
        process.exit(1);
    }
}

checkExistingReports();
