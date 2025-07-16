const express = require('express');
const router = express.Router();
const assetManager = require('../utils/assetManager');
const { uploadConfigs, processUploadedFiles, handleMulterError } = require('../utils/uploadManager');
const Report = require('../models/Report');
const Tindakan = require('../models/Tindakan');

/**
 * Asset Management Routes
 * Endpoint untuk mengelola file uploads dengan struktur yang terorganisir
 */

// 📁 Get asset statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = assetManager.getFileStats();
        
        // Get database statistics
        const reportCount = await Report.countDocuments();
        const tindakanCount = await Tindakan.countDocuments();
        
        res.json({
            status: 'success',
            data: {
                files: stats,
                database: {
                    reports: reportCount,
                    tindakan: tindakanCount
                },
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('❌ Error getting asset stats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving asset statistics',
            error: error.message
        });
    }
});

// 🧹 Cleanup orphaned files
router.post('/cleanup', async (req, res) => {
    try {
        // Get all active file URLs from database
        const reports = await Report.find({}, 'photos').lean();
        const tindakans = await Tindakan.find({}, 'photos').lean();
        
        const activeFiles = [];
        
        // Collect report photos
        reports.forEach(report => {
            if (report.photos && Array.isArray(report.photos)) {
                report.photos.forEach(photo => {
                    if (photo.url) activeFiles.push(photo.url);
                    if (photo.originalUrl) activeFiles.push(photo.originalUrl);
                });
            }
        });
        
        // Collect tindakan photos
        tindakans.forEach(tindakan => {
            if (tindakan.photos && Array.isArray(tindakan.photos)) {
                tindakan.photos.forEach(photo => {
                    if (photo.url) activeFiles.push(photo.url);
                    if (photo.originalUrl) activeFiles.push(photo.originalUrl);
                });
            }
        });
        
        await assetManager.cleanupOrphanedFiles(activeFiles);
        
        res.json({
            status: 'success',
            message: 'Cleanup completed successfully',
            activeFiles: activeFiles.length,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error during cleanup process',
            error: error.message
        });
    }
});

// 📤 Upload files for reports
router.post('/upload/report', 
    uploadConfigs.reports.array('files', 10),
    processUploadedFiles('report'),
    (req, res) => {
        try {
            if (!req.processedFiles || req.processedFiles.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No files uploaded'
                });
            }
            
            res.json({
                status: 'success',
                message: `${req.processedFiles.length} files uploaded successfully`,
                files: req.processedFiles.map(file => ({
                    url: file.url,
                    type: file.type,
                    originalName: file.originalName,
                    size: file.fileSize,
                    folder: file.folder
                }))
            });
        } catch (error) {
            console.error('❌ Error uploading report files:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error uploading files',
                error: error.message
            });
        }
    }
);

// 📤 Upload files for tindakan
router.post('/upload/tindakan', 
    uploadConfigs.tindakan.array('files', 5),
    processUploadedFiles('tindakan'),
    (req, res) => {
        try {
            if (!req.processedFiles || req.processedFiles.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No files uploaded'
                });
            }
            
            res.json({
                status: 'success',
                message: `${req.processedFiles.length} files uploaded successfully`,
                files: req.processedFiles.map(file => ({
                    url: file.url,
                    type: file.type,
                    originalName: file.originalName,
                    size: file.fileSize,
                    folder: file.folder
                }))
            });
        } catch (error) {
            console.error('❌ Error uploading tindakan files:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error uploading files',
                error: error.message
            });
        }
    }
);

// 📤 Upload single image (for WhatsApp messages)
router.post('/upload/image', 
    uploadConfigs.images.single('image'),
    processUploadedFiles('report'),
    (req, res) => {
        try {
            if (!req.processedFiles || req.processedFiles.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No image uploaded'
                });
            }
            
            const file = req.processedFiles[0];
            res.json({
                status: 'success',
                message: 'Image uploaded successfully',
                file: {
                    url: file.url,
                    type: file.type,
                    originalName: file.originalName,
                    size: file.fileSize,
                    filename: file.fileName // For backward compatibility
                }
            });
        } catch (error) {
            console.error('❌ Error uploading image:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error uploading image',
                error: error.message
            });
        }
    }
);

// 📤 Upload single video (for WhatsApp messages)
router.post('/upload/video', 
    uploadConfigs.videos.single('video'),
    processUploadedFiles('report'),
    (req, res) => {
        try {
            if (!req.processedFiles || req.processedFiles.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No video uploaded'
                });
            }
            
            const file = req.processedFiles[0];
            res.json({
                status: 'success',
                message: 'Video uploaded successfully',
                file: {
                    url: file.url,
                    type: file.type,
                    originalName: file.originalName,
                    size: file.fileSize,
                    filename: file.fileName
                }
            });
        } catch (error) {
            console.error('❌ Error uploading video:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error uploading video',
                error: error.message
            });
        }
    }
);

// 📤 Upload single audio (for WhatsApp messages)
router.post('/upload/audio', 
    uploadConfigs.audio.single('audio'),
    processUploadedFiles('report'),
    (req, res) => {
        try {
            if (!req.processedFiles || req.processedFiles.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No audio uploaded'
                });
            }
            
            const file = req.processedFiles[0];
            res.json({
                status: 'success',
                message: 'Audio uploaded successfully',
                file: {
                    url: file.url,
                    type: file.type,
                    originalName: file.originalName,
                    size: file.fileSize,
                    filename: file.fileName
                }
            });
        } catch (error) {
            console.error('❌ Error uploading audio:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error uploading audio',
                error: error.message
            });
        }
    }
);

// 📤 Upload single document (for WhatsApp messages)
router.post('/upload/document', 
    uploadConfigs.documents.single('document'),
    processUploadedFiles('report'),
    (req, res) => {
        try {
            if (!req.processedFiles || req.processedFiles.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No document uploaded'
                });
            }
            
            const file = req.processedFiles[0];
            res.json({
                status: 'success',
                message: 'Document uploaded successfully',
                file: {
                    url: file.url,
                    type: file.type,
                    originalName: file.originalName,
                    size: file.fileSize,
                    filename: file.fileName
                }
            });
        } catch (error) {
            console.error('❌ Error uploading document:', error);
            res.status(500).json({
                status: 'error',
                message: 'Error uploading document',
                error: error.message
            });
        }
    }
);

// Error handler
router.use(handleMulterError);

module.exports = router;
