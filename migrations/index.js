const mongoose = require('mongoose');
const MigrationManager = require('../utils/MigrationManager');

// Import models
const Report = require('../models/Report');
const UserProfile = require('../models/UserProfile');

const migrationManager = new MigrationManager();

// Migration 1: Fix photos structure from string array to object array
migrationManager.addMigration(
    '2025_07_16_001',
    'Convert photos field from string array to object array with metadata',
    async () => {
        console.log('🔧 Starting photos structure migration...');
        
        // Find reports with old string array format or corrupted data
        const corruptedReports = await Report.find({
            $or: [
                { 'photos.0': { $type: 'string' } },  // Old string format
                { 'photos.0.0': { $exists: true } }   // Corrupted format with numeric keys
            ]
        });
        
        console.log(`📊 Found ${corruptedReports.length} reports to migrate`);
        
        let migrated = 0;
        let cleaned = 0;
        
        for (const report of corruptedReports) {
            const cleanedPhotos = [];
            
            for (const photo of report.photos) {
                if (typeof photo === 'string') {
                    // Convert old string format to new object format
                    cleanedPhotos.push({
                        url: photo,
                        type: photo.includes('video') ? 'video' : 
                              photo.includes('audio') ? 'audio' : 'image',
                        caption: '',
                        originalUrl: photo
                    });
                } else if (photo && typeof photo === 'object') {
                    // Check if it's corrupted (has numeric keys)
                    const keys = Object.keys(photo);
                    const hasNumericKeys = keys.some(key => !isNaN(key));
                    
                    if (hasNumericKeys && !photo.url) {
                        // Try to reconstruct URL from corrupted data
                        const reconstructedUrl = keys
                            .filter(key => !isNaN(key))
                            .sort((a, b) => parseInt(a) - parseInt(b))
                            .map(key => photo[key])
                            .join('');
                        
                        if (reconstructedUrl.startsWith('/uploads')) {
                            cleanedPhotos.push({
                                url: reconstructedUrl,
                                type: reconstructedUrl.includes('video') ? 'video' : 
                                      reconstructedUrl.includes('audio') ? 'audio' : 'image',
                                caption: photo.caption || '',
                                originalUrl: reconstructedUrl
                            });
                        }
                    } else if (photo.url) {
                        // Already in correct format, just ensure all fields exist
                        cleanedPhotos.push({
                            url: photo.url,
                            type: photo.type || (photo.url.includes('video') ? 'video' : 
                                  photo.url.includes('audio') ? 'audio' : 'image'),
                            caption: photo.caption || '',
                            originalUrl: photo.originalUrl || photo.url
                        });
                    }
                }
            }
            
            // Update the report
            await Report.findByIdAndUpdate(report._id, { photos: cleanedPhotos });
            
            if (cleanedPhotos.length > 0) {
                migrated++;
            } else {
                cleaned++;
            }
        }
        
        console.log(`✅ Photos migration completed: ${migrated} migrated, ${cleaned} cleaned`);
    }
);

// Migration 2: Reset any stuck user sessions from failed report creation
migrationManager.addMigration(
    '2025_07_16_002',
    'Reset stuck user sessions from failed report creation processes',
    async () => {
        console.log('🔄 Resetting stuck user sessions...');
        
        const stuckUsers = await UserProfile.find({
            'session.step': { $exists: true, $ne: null }
        });
        
        console.log(`📊 Found ${stuckUsers.length} users with stuck sessions`);
        
        for (const user of stuckUsers) {
            await UserProfile.findByIdAndUpdate(user._id, {
                $unset: { session: 1 }
            });
        }
        
        console.log(`✅ Reset ${stuckUsers.length} stuck sessions`);
    }
);

// Migration 3: Ensure all reports have proper status_laporan field
migrationManager.addMigration(
    '2025_07_16_003',
    'Ensure all reports have proper status_laporan field with default value',
    async () => {
        console.log('🔧 Checking report status fields...');
        
        const reportsWithoutStatus = await Report.find({
            status_laporan: { $exists: false }
        });
        
        console.log(`📊 Found ${reportsWithoutStatus.length} reports without status`);
        
        if (reportsWithoutStatus.length > 0) {
            await Report.updateMany(
                { status_laporan: { $exists: false } },
                { $set: { status_laporan: 'Diterima' } }
            );
            console.log(`✅ Set default status for ${reportsWithoutStatus.length} reports`);
        }
    }
);

// Migration 4: Add indexes for performance
migrationManager.addMigration(
    '2025_07_16_004',
    'Add database indexes for improved performance',
    async () => {
        console.log('🚀 Creating database indexes...');
        
        try {
            // Check and create indexes only if they don't exist
            const reportIndexes = await Report.collection.listIndexes().toArray();
            const existingIndexNames = reportIndexes.map(idx => idx.name);
            
            // Index for reports
            if (!existingIndexNames.includes('sessionId_1')) {
                await Report.collection.createIndex({ sessionId: 1 }, { unique: true });
                console.log('✅ Created sessionId index');
            } else {
                console.log('ℹ️ SessionId index already exists');
            }
            
            if (!existingIndexNames.includes('from_1')) {
                await Report.collection.createIndex({ from: 1 });
                console.log('✅ Created from index');
            } else {
                console.log('ℹ️ From index already exists');
            }
            
            if (!existingIndexNames.includes('status_laporan_1')) {
                await Report.collection.createIndex({ status_laporan: 1 });
                console.log('✅ Created status_laporan index');
            } else {
                console.log('ℹ️ Status_laporan index already exists');
            }
            
            if (!existingIndexNames.includes('createdAt_-1')) {
                await Report.collection.createIndex({ createdAt: -1 });
                console.log('✅ Created createdAt index');
            } else {
                console.log('ℹ️ CreatedAt index already exists');
            }
            
            if (!existingIndexNames.includes('location.desa_1')) {
                await Report.collection.createIndex({ "location.desa": 1 });
                console.log('✅ Created location.desa index');
            } else {
                console.log('ℹ️ Location.desa index already exists');
            }
            
            if (!existingIndexNames.includes('location.kecamatan_1')) {
                await Report.collection.createIndex({ "location.kecamatan": 1 });
                console.log('✅ Created location.kecamatan index');
            } else {
                console.log('ℹ️ Location.kecamatan index already exists');
            }
            
            // Check and create UserProfile indexes
            const userIndexes = await UserProfile.collection.listIndexes().toArray();
            const existingUserIndexNames = userIndexes.map(idx => idx.name);
            
            if (!existingUserIndexNames.includes('name_1')) {
                await UserProfile.collection.createIndex({ name: 1 });
                console.log('✅ Created name index');
            } else {
                console.log('ℹ️ Name index already exists');
            }
            
            console.log('✅ Database indexes migration completed successfully');
        } catch (error) {
            if (error.code === 11000 || error.codeName === 'IndexOptionsConflict') {
                console.log('ℹ️ Some indexes already exist, skipping...');
            } else {
                throw error;
            }
        }
    }
);

module.exports = migrationManager;
