// controllers/fileOrganizationController.js
const fs = require('fs');
const path = require('path');
const Message = require('../models/messageModel');
const Report = require('../models/Report');
const Tindakan = require('../models/Tindakan');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const mkdir = promisify(fs.mkdir);

/**
 * Update file URLs in all models after file organization
 */
async function updateFileUrlsInModels(oldUrl, newUrl) {
    const updates = [];
    
    try {
        // Update Messages
        const messageUpdate = await Message.updateMany(
            { mediaUrl: oldUrl },
            { $set: { mediaUrl: newUrl } }
        );
        if (messageUpdate.modifiedCount > 0) {
            updates.push(`Messages: ${messageUpdate.modifiedCount} updated`);
        }

        // Update Reports with photos array
        const reportUpdate = await Report.updateMany(
            { photos: oldUrl },
            { $set: { "photos.$": newUrl } }
        );
        if (reportUpdate.modifiedCount > 0) {
            updates.push(`Reports: ${reportUpdate.modifiedCount} updated`);
        }

        // Update Tindakan with photos array
        const tindakanUpdate = await Tindakan.updateMany(
            { photos: oldUrl },
            { $set: { "photos.$": newUrl } }
        );
        if (tindakanUpdate.modifiedCount > 0) {
            updates.push(`Tindakan: ${tindakanUpdate.modifiedCount} updated`);
        }

        return updates;
    } catch (error) {
        console.error('Error updating URLs in models:', error);
        throw error;
    }
}

/**
 * Get statistics for a directory
 */
async function getDirectoryStats(dirPath) {
    const stats = {
        fileCount: 0,
        totalSize: 0,
        subdirectories: {}
    };

    try {
        const items = await readdir(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const itemStat = await stat(itemPath);
            
            if (itemStat.isDirectory()) {
                const subStats = await getDirectoryStats(itemPath);
                stats.subdirectories[item] = subStats;
                stats.fileCount += subStats.fileCount;
                stats.totalSize += subStats.totalSize;
            } else {
                stats.fileCount++;
                stats.totalSize += itemStat.size;
            }
        }
    } catch (error) {
        // Directory might not exist
        console.log(`Directory ${dirPath} not accessible: ${error.message}`);
    }

    return stats;
}

/**
 * Ensure target directories exist
 */
async function ensureDirectories(publicDir) {
    const directories = [
        'uploads/images',
        'uploads/videos', 
        'uploads/audio',
        'uploads/documents',
        'assets/images',
        'assets/videos',
        'assets/audio',
        'assets/documents',
        'uploadsTindakan'
    ];

    for (const dir of directories) {
        const fullPath = path.join(publicDir, dir);
        try {
            await mkdir(fullPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }
}

/**
 * Determine file type from filename or extension
 */
function getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
    const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'];
    const documentExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];
    
    if (imageExts.includes(ext)) return 'images';
    if (videoExts.includes(ext)) return 'videos';
    if (audioExts.includes(ext)) return 'audio';
    if (documentExts.includes(ext)) return 'documents';
    
    return 'others';
}

/**
 * Get target directory based on file type and current location
 */
function getTargetDirectory(fileType, currentPath) {
    // Determine base directory (uploads, assets, or uploadsTindakan)
    if (currentPath.includes('uploadsTindakan')) {
        return 'uploadsTindakan';
    } else if (currentPath.includes('assets')) {
        return `assets/${fileType}`;
    } else {
        return `uploads/${fileType}`;
    }
}

/**
 * Get target subdirectory for organizing files
 */
function getTargetSubDirectory(fileType) {
    return fileType;
}

/**
 * Organize file for a specific URL (for reports and tindakan)
 */
async function organizeFileForUrl(mediaUrl, publicDir) {
    if (!mediaUrl) return null;

    let currentPath;
    
    // Determine current file path
    if (mediaUrl.startsWith('/uploads/') || mediaUrl.startsWith('/assets/') || mediaUrl.startsWith('/uploadsTindakan/')) {
        currentPath = path.join(publicDir, mediaUrl);
    } else {
        // Legacy file might be in root public or somewhere else
        currentPath = path.join(publicDir, mediaUrl);
    }

    // Check if file exists
    try {
        await stat(currentPath);
    } catch (error) {
        // File doesn't exist, skip
        return null;
    }

    // Determine file type and target directory
    const fileType = getFileType(mediaUrl);
    const targetDir = getTargetDirectory(fileType, mediaUrl);
    const fileName = path.basename(mediaUrl);
    const targetPath = path.join(publicDir, targetDir, fileName);

    // Skip if already in correct location
    if (currentPath === targetPath) {
        return null;
    }

    // Move file to correct location
    try {
        await rename(currentPath, targetPath);
        
        // Update URLs in all models
        const newMediaUrl = `/${targetDir}/${fileName}`;
        const updates = await updateFileUrlsInModels(mediaUrl, newMediaUrl);
        
        console.log(`Moved ${mediaUrl} to ${newMediaUrl}`);
        if (updates.length > 0) {
            console.log(`Database updates: ${updates.join(', ')}`);
        }
        
        return {
            type: fileType,
            from: mediaUrl,
            to: newMediaUrl,
            dbUpdates: updates
        };
    } catch (error) {
        console.error(`Error moving file ${mediaUrl}:`, error);
        throw error;
    }
}

/**
 * Organize file for a specific message
 */
async function organizeFileForMessage(message, publicDir) {
    if (!message.mediaUrl) return null;

    const mediaUrl = message.mediaUrl;
    let currentPath;
    
    // Determine current file path
    if (mediaUrl.startsWith('/uploads/') || mediaUrl.startsWith('/assets/') || mediaUrl.startsWith('/uploadsTindakan/')) {
        currentPath = path.join(publicDir, mediaUrl);
    } else {
        // Legacy file might be in root public or somewhere else
        currentPath = path.join(publicDir, mediaUrl);
    }

    // Check if file exists
    try {
        await stat(currentPath);
    } catch (error) {
        // File doesn't exist, skip
        return null;
    }

    // Determine file type and target directory
    const fileType = getFileType(mediaUrl);
    const targetDir = getTargetDirectory(fileType, mediaUrl);
    const fileName = path.basename(mediaUrl);
    const targetPath = path.join(publicDir, targetDir, fileName);

    // Skip if already in correct location
    if (currentPath === targetPath) {
        return null;
    }

    // Move file to correct location
    try {
        await rename(currentPath, targetPath);
        
        // Update URLs in all models
        const newMediaUrl = `/${targetDir}/${fileName}`;
        const updates = await updateFileUrlsInModels(mediaUrl, newMediaUrl);
        
        console.log(`Moved ${mediaUrl} to ${newMediaUrl}`);
        if (updates.length > 0) {
            console.log(`Database updates: ${updates.join(', ')}`);
        }
        
        return {
            type: fileType,
            from: mediaUrl,
            to: newMediaUrl,
            dbUpdates: updates
        };
    } catch (error) {
        console.error(`Error moving file ${mediaUrl}:`, error);
        throw error;
    }
}

/**
 * Organize legacy files that might not be in database
 */
async function organizeLegacyFiles(publicDir, results) {
    const legacyDirs = ['uploads', 'assets', 'uploadsTindakan'];
    
    for (const dir of legacyDirs) {
        const dirPath = path.join(publicDir, dir);
        
        try {
            const files = await readdir(dirPath);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const fileStat = await stat(filePath);
                
                // Skip directories
                if (fileStat.isDirectory()) continue;
                
                // Determine file type
                const fileType = getFileType(file);
                const targetSubDir = getTargetSubDirectory(fileType);
                
                // Skip if already in a subdirectory
                if (dir.includes('/')) continue;
                
                const targetPath = path.join(publicDir, dir, targetSubDir, file);
                
                // Skip if already in correct location
                if (filePath === targetPath) continue;
                
                try {
                    await rename(filePath, targetPath);
                    results.organized++;
                    results.summary[fileType]++;
                    console.log(`Moved legacy file ${file} to ${dir}/${targetSubDir}/`);
                } catch (error) {
                    results.errors.push({
                        file: file,
                        error: error.message
                    });
                }
            }
        } catch (error) {
            // Directory might not exist, skip
            console.log(`Skipping directory ${dir}: ${error.message}`);
        }
    }
}

class FileOrganizationController {
    /**
     * Analyze and reorganize files in the public directory
     */
    async analyzeAndOrganizeFiles(req, res) {
        try {
            const publicDir = path.join(__dirname, '..', 'public');
            const results = {
                scanned: 0,
                organized: 0,
                errors: [],
                summary: {
                    images: 0,
                    videos: 0,
                    audio: 0,
                    documents: 0,
                    others: 0
                }
            };

            // Get all messages with media URLs
            const messagesWithMedia = await Message.find({
                mediaUrl: { $exists: true, $ne: null }
            });

            // Get all reports with photos
            const reportsWithPhotos = await Report.find({
                photos: { $exists: true, $ne: [], $not: { $size: 0 } }
            });

            // Get all tindakan with photos
            const tindakanWithPhotos = await Tindakan.find({
                photos: { $exists: true, $ne: [], $not: { $size: 0 } }
            });

            console.log(`Found ${messagesWithMedia.length} messages, ${reportsWithPhotos.length} reports, ${tindakanWithPhotos.length} tindakan with media URLs`);

            // Create target directories if they don't exist
            await ensureDirectories(publicDir);

            // Process messages
            for (const message of messagesWithMedia) {
                results.scanned++;
                
                try {
                    const organized = await organizeFileForMessage(message, publicDir);
                    if (organized) {
                        results.organized++;
                        results.summary[organized.type]++;
                    }
                } catch (error) {
                    results.errors.push({
                        messageId: message._id,
                        mediaUrl: message.mediaUrl,
                        error: error.message
                    });
                }
            }

            // Process reports
            for (const report of reportsWithPhotos) {
                for (const photoUrl of report.photos) {
                    results.scanned++;
                    
                    try {
                        const organized = await organizeFileForUrl(photoUrl, publicDir);
                        if (organized) {
                            results.organized++;
                            results.summary[organized.type]++;
                        }
                    } catch (error) {
                        results.errors.push({
                            reportId: report._id,
                            mediaUrl: photoUrl,
                            error: error.message
                        });
                    }
                }
            }

            // Process tindakan
            for (const tindakan of tindakanWithPhotos) {
                for (const photoUrl of tindakan.photos) {
                    results.scanned++;
                    
                    try {
                        const organized = await organizeFileForUrl(photoUrl, publicDir);
                        if (organized) {
                            results.organized++;
                            results.summary[organized.type]++;
                        }
                    } catch (error) {
                        results.errors.push({
                            tindakanId: tindakan._id,
                            mediaUrl: photoUrl,
                            error: error.message
                        });
                    }
                }
            }

            // Also organize loose files in public directory
            await organizeLegacyFiles(publicDir, results);

            res.json({
                success: true,
                message: 'File organization completed',
                results
            });

        } catch (error) {
            console.error('Error in analyzeAndOrganizeFiles:', error);
            res.status(500).json({
                success: false,
                message: 'Error organizing files',
                error: error.message
            });
        }
    }

    /**
     * Get file organization statistics
     */
    async getOrganizationStats(req, res) {
        try {
            const publicDir = path.join(__dirname, '..', 'public');
            const stats = {
                directories: {},
                totalFiles: 0,
                totalSize: 0
            };

            const directories = ['uploads', 'assets', 'uploadsTindakan'];
            
            for (const dir of directories) {
                const dirPath = path.join(publicDir, dir);
                const dirStats = await getDirectoryStats(dirPath);
                stats.directories[dir] = dirStats;
                stats.totalFiles += dirStats.fileCount;
                stats.totalSize += dirStats.totalSize;
            }

            res.json({
                success: true,
                stats
            });

        } catch (error) {
            console.error('Error getting organization stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting organization stats',
                error: error.message
            });
        }
    }

    /**
     * Verify file organization integrity
     */
    async verifyFileIntegrity(req, res) {
        try {
            const publicDir = path.join(__dirname, '..', 'public');
            const results = {
                checkedMessages: 0,
                checkedReports: 0,
                checkedTindakan: 0,
                brokenLinks: [],
                validLinks: 0
            };

            // Check messages with media URLs
            const messagesWithMedia = await Message.find({
                mediaUrl: { $exists: true, $ne: null }
            });

            for (const message of messagesWithMedia) {
                results.checkedMessages++;
                
                const mediaUrl = message.mediaUrl;
                const filePath = path.join(publicDir, mediaUrl);
                
                try {
                    await stat(filePath);
                    results.validLinks++;
                } catch (error) {
                    results.brokenLinks.push({
                        type: 'message',
                        id: message._id,
                        mediaUrl: mediaUrl,
                        from: message.from,
                        timestamp: message.timestamp
                    });
                }
            }

            // Check reports with photos
            const reportsWithPhotos = await Report.find({
                photos: { $exists: true, $ne: [], $not: { $size: 0 } }
            });

            for (const report of reportsWithPhotos) {
                for (const photoUrl of report.photos) {
                    results.checkedReports++;
                    
                    const filePath = path.join(publicDir, photoUrl);
                    
                    try {
                        await stat(filePath);
                        results.validLinks++;
                    } catch (error) {
                        results.brokenLinks.push({
                            type: 'report',
                            id: report._id,
                            mediaUrl: photoUrl,
                            sessionId: report.sessionId
                        });
                    }
                }
            }

            // Check tindakan with photos
            const tindakanWithPhotos = await Tindakan.find({
                photos: { $exists: true, $ne: [], $not: { $size: 0 } }
            });

            for (const tindakan of tindakanWithPhotos) {
                for (const photoUrl of tindakan.photos) {
                    results.checkedTindakan++;
                    
                    const filePath = path.join(publicDir, photoUrl);
                    
                    try {
                        await stat(filePath);
                        results.validLinks++;
                    } catch (error) {
                        results.brokenLinks.push({
                            type: 'tindakan',
                            id: tindakan._id,
                            mediaUrl: photoUrl,
                            reportId: tindakan.report
                        });
                    }
                }
            }

            res.json({
                success: true,
                message: 'File integrity verification completed',
                results
            });

        } catch (error) {
            console.error('Error verifying file integrity:', error);
            res.status(500).json({
                success: false,
                message: 'Error verifying file integrity',
                error: error.message
            });
        }
    }
}

module.exports = new FileOrganizationController();
