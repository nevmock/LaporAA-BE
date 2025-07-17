const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import models
const Report = require('./models/Report');

/**
 * Script untuk memperbaiki path media yang tidak konsisten
 * Menangani perbedaan struktur folder antara data lama dan baru:
 * - Data lama: /uploads/filename.ext
 * - Data baru: /uploads/subfolder/filename.ext
 */

async function fixMediaPaths() {
    try {
        console.log('🔧 Starting media path fix process...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all reports with photos
        const reports = await Report.find({
            'photos.0': { $exists: true }
        });

        console.log(`📊 Found ${reports.length} reports with photos`);

        let fixedCount = 0;
        let errorCount = 0;

        for (const report of reports) {
            let reportModified = false;
            
            for (let i = 0; i < report.photos.length; i++) {
                const photo = report.photos[i];
                const originalUrl = photo.url;
                
                // Skip if already a complete URL
                if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
                    continue;
                }

                // Extract filename from current path
                const filename = originalUrl.split('/').pop();
                if (!filename) continue;

                // Determine file type and expected subfolder
                const fileExt = filename.split('.').pop()?.toLowerCase() || '';
                let expectedSubfolder = '';
                
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
                    // Images: Check both /uploads/ and /uploads/images/
                    expectedSubfolder = 'images';
                } else if (['mp4', 'avi', 'mov', 'webm', 'mkv', 'wmv'].includes(fileExt)) {
                    expectedSubfolder = 'videos';
                } else if (['mp3', 'wav', 'ogg', 'aac'].includes(fileExt)) {
                    expectedSubfolder = 'audio';
                } else if (['pdf', 'doc', 'docx'].includes(fileExt)) {
                    expectedSubfolder = 'documents';
                }

                // Check which path actually exists
                const possiblePaths = [
                    path.join(__dirname, 'public', 'uploads', filename), // Direct in uploads
                    path.join(__dirname, 'public', 'uploads', expectedSubfolder, filename) // In subfolder
                ];

                let actualPath = null;
                let correctUrl = null;

                for (const possiblePath of possiblePaths) {
                    if (fs.existsSync(possiblePath)) {
                        actualPath = possiblePath;
                        // Convert back to URL format
                        if (possiblePath.includes(path.join('uploads', expectedSubfolder))) {
                            correctUrl = `/uploads/${expectedSubfolder}/${filename}`;
                        } else {
                            correctUrl = `/uploads/${filename}`;
                        }
                        break;
                    }
                }

                if (actualPath && correctUrl && correctUrl !== originalUrl) {
                    console.log(`🔄 Fixing path for ${filename}:`);
                    console.log(`   From: ${originalUrl}`);
                    console.log(`   To: ${correctUrl}`);
                    console.log(`   File exists at: ${actualPath}`);
                    
                    // Update the photo URL
                    report.photos[i].url = correctUrl;
                    if (report.photos[i].originalUrl) {
                        report.photos[i].originalUrl = correctUrl;
                    }
                    
                    reportModified = true;
                    fixedCount++;
                } else if (!actualPath) {
                    console.log(`❌ File not found for ${filename} (original path: ${originalUrl})`);
                    errorCount++;
                }
            }

            // Save report if modified
            if (reportModified) {
                await report.save();
                console.log(`💾 Updated report ${report.sessionId}`);
            }
        }

        console.log('\n📈 Summary:');
        console.log(`✅ Fixed paths: ${fixedCount}`);
        console.log(`❌ Files not found: ${errorCount}`);
        console.log(`📁 Total reports processed: ${reports.length}`);

    } catch (error) {
        console.error('❌ Error during fix process:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

/**
 * Function to analyze current media structure
 */
async function analyzeMediaStructure() {
    try {
        console.log('🔍 Analyzing media structure...');
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const reports = await Report.find({
            'photos.0': { $exists: true }
        }).limit(20);

        console.log('📊 Sample photo paths from database:');
        
        const pathPatterns = {};
        
        reports.forEach((report, index) => {
            console.log(`\n--- Report ${index + 1} (${report.sessionId}) ---`);
            report.photos.forEach((photo, photoIndex) => {
                console.log(`  Photo ${photoIndex + 1}: ${photo.url}`);
                
                // Analyze path pattern
                const pathParts = photo.url.split('/');
                const pattern = pathParts.slice(0, -1).join('/');
                pathPatterns[pattern] = (pathPatterns[pattern] || 0) + 1;
            });
        });

        console.log('\n📈 Path patterns found:');
        Object.entries(pathPatterns).forEach(([pattern, count]) => {
            console.log(`${pattern}: ${count} files`);
        });

        // Check physical file structure
        console.log('\n📁 Physical file structure:');
        const uploadsDir = path.join(__dirname, 'public', 'uploads');
        
        if (fs.existsSync(uploadsDir)) {
            const items = fs.readdirSync(uploadsDir, { withFileTypes: true });
            
            console.log('📂 /uploads/ contents:');
            items.forEach(item => {
                if (item.isDirectory()) {
                    console.log(`  📁 ${item.name}/`);
                    try {
                        const subItems = fs.readdirSync(path.join(uploadsDir, item.name));
                        console.log(`    Contains ${subItems.length} files`);
                    } catch (e) {
                        console.log(`    (Cannot read directory)`);
                    }
                } else {
                    // Count files directly in uploads
                    console.log(`  📄 Direct files found`);
                }
            });
        }

    } catch (error) {
        console.error('❌ Error during analysis:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run based on command line argument
const command = process.argv[2];

if (command === 'analyze') {
    analyzeMediaStructure();
} else if (command === 'fix') {
    fixMediaPaths();
} else {
    console.log('Usage:');
    console.log('  node fix-media-paths.js analyze  - Analyze current media structure');
    console.log('  node fix-media-paths.js fix      - Fix inconsistent media paths');
}
