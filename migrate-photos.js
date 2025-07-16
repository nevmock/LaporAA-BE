const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGO_URI);

// Import Report model
const Report = require('./models/Report');

async function migrateCorruptedPhotos() {
    try {
        console.log('🔧 Starting migration for corrupted photos...');
        
        // Find reports with corrupted photos (photos as objects with numeric keys)
        const corruptedReports = await Report.find({
            $or: [
                { 'photos.0.0': { $exists: true } }, // Numeric keys indicate corruption
                { 'photos.0': { $type: 'string' } }  // Old string format
            ]
        });
        
        console.log(`📊 Found ${corruptedReports.length} reports with corrupted photos`);
        
        let migrated = 0;
        
        for (const report of corruptedReports) {
            console.log(`\n🔄 Processing report: ${report.sessionId}`);
            
            const cleanedPhotos = [];
            
            for (let i = 0; i < report.photos.length; i++) {
                const photo = report.photos[i];
                console.log(`  📷 Photo ${i + 1}:`, typeof photo);
                
                if (typeof photo === 'string') {
                    // Old format: convert string to object
                    cleanedPhotos.push({
                        url: photo,
                        type: photo.includes('video') ? 'video' : 'image',
                        caption: '',
                        originalUrl: photo
                    });
                    console.log(`    ✅ Converted string to object: ${photo}`);
                } else if (photo && typeof photo === 'object') {
                    // Check if it's corrupted (has numeric keys)
                    const keys = Object.keys(photo);
                    const hasNumericKeys = keys.some(key => !isNaN(key));
                    
                    if (hasNumericKeys && !photo.url) {
                        // Corrupted: reconstruct URL from numeric keys
                        const reconstructedUrl = keys
                            .filter(key => !isNaN(key))
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .map(key => photo[key])
                            .join('');
                        
                        if (reconstructedUrl.startsWith('/uploads')) {
                            cleanedPhotos.push({
                                url: reconstructedUrl,
                                type: reconstructedUrl.includes('video') ? 'video' : 'image',
                                caption: photo.caption || '',
                                originalUrl: reconstructedUrl
                            });
                            console.log(`    🔧 Reconstructed URL: ${reconstructedUrl}`);
                        } else {
                            console.log(`    ❌ Could not reconstruct URL from corrupted data`);
                        }
                    } else if (photo.url) {
                        // Already in correct format
                        cleanedPhotos.push({
                            url: photo.url,
                            type: photo.type || (photo.url.includes('video') ? 'video' : 'image'),
                            caption: photo.caption || '',
                            originalUrl: photo.originalUrl || photo.url
                        });
                        console.log(`    ✅ Already in correct format: ${photo.url}`);
                    }
                }
            }
            
            if (cleanedPhotos.length > 0) {
                await Report.findByIdAndUpdate(report._id, { photos: cleanedPhotos });
                migrated++;
                console.log(`    ✅ Updated with ${cleanedPhotos.length} photos`);
            } else {
                // Clear corrupted photos if no valid data found
                await Report.findByIdAndUpdate(report._id, { photos: [] });
                console.log(`    🗑️ Cleared corrupted photos`);
            }
        }
        
        console.log(`\n🎉 Migration completed! ${migrated} reports migrated`);
        
        // Verify migration
        const remainingCorrupted = await Report.countDocuments({
            $or: [
                { 'photos.0.0': { $exists: true } },
                { 'photos.0': { $type: 'string' } }
            ]
        });
        
        console.log(`📊 Remaining corrupted reports: ${remainingCorrupted}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateCorruptedPhotos();
