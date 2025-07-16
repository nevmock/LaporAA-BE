const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const assetManager = require('./assetManager');

/**
 * Enhanced Multer Configuration dengan Asset Manager
 */

// Storage untuk laporan (reports)
const reportStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Temporary directory, akan dipindah oleh assetManager
        const tempDir = path.join(__dirname, '../temp');
        require('fs').mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // Generate temporary filename
        const uniqueName = `temp-${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Storage untuk tindakan
const tindakanStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(__dirname, '../temp');
        require('fs').mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = `temp-tindakan-${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter yang lebih komprehensif
const createFileFilter = (allowedTypes) => {
    return (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            const error = new Error(`File type ${file.mimetype} tidak diizinkan. Tipe yang diizinkan: ${allowedTypes.join(', ')}`);
            error.code = 'INVALID_FILE_TYPE';
            cb(error, false);
        }
    };
};

// Allowed types untuk berbagai konten
const allowedTypes = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    videos: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    all: [] // Will be populated below
};

// Combine all allowed types
allowedTypes.all = [
    ...allowedTypes.images,
    ...allowedTypes.videos,
    ...allowedTypes.audio,
    ...allowedTypes.documents
];

// Size limits (in bytes)
const sizeLimits = {
    image: 10 * 1024 * 1024,    // 10MB for images
    video: 100 * 1024 * 1024,   // 100MB for videos
    audio: 50 * 1024 * 1024,    // 50MB for audio
    document: 25 * 1024 * 1024  // 25MB for documents
};

// Multer configurations
const uploadConfigs = {
    // Untuk laporan - support semua jenis file
    reports: multer({
        storage: reportStorage,
        fileFilter: createFileFilter(allowedTypes.all),
        limits: {
            fileSize: 100 * 1024 * 1024, // 100MB max
            files: 10 // Max 10 files per upload
        }
    }),
    
    // Untuk tindakan - lebih restrictive
    tindakan: multer({
        storage: tindakanStorage,
        fileFilter: createFileFilter([...allowedTypes.images, ...allowedTypes.documents]),
        limits: {
            fileSize: 25 * 1024 * 1024, // 25MB max
            files: 5 // Max 5 files per upload
        }
    }),
    
    // Untuk images saja
    images: multer({
        storage: reportStorage,
        fileFilter: createFileFilter(allowedTypes.images),
        limits: {
            fileSize: sizeLimits.image,
            files: 5
        }
    }),
    
    // Untuk videos saja
    videos: multer({
        storage: reportStorage,
        fileFilter: createFileFilter(allowedTypes.videos),
        limits: {
            fileSize: sizeLimits.video,
            files: 2
        }
    }),
    
    // Untuk audio saja
    audio: multer({
        storage: reportStorage,
        fileFilter: createFileFilter(allowedTypes.audio),
        limits: {
            fileSize: sizeLimits.audio,
            files: 3
        }
    }),
    
    // Untuk documents saja
    documents: multer({
        storage: reportStorage,
        fileFilter: createFileFilter(allowedTypes.documents),
        limits: {
            fileSize: sizeLimits.document,
            files: 5
        }
    })
};

/**
 * Middleware untuk memproses file setelah upload dengan AssetManager
 */
const processUploadedFiles = (contentType = 'report') => {
    return async (req, res, next) => {
        if (!req.files && !req.file) {
            return next();
        }
        
        try {
            const files = req.files || [req.file];
            const processedFiles = [];
            
            for (const file of files) {
                if (file) {
                    const metadata = await assetManager.processUploadedFile(
                        file.path,
                        file.originalname,
                        file.mimetype,
                        contentType
                    );
                    
                    // Add additional file info
                    metadata.fieldName = file.fieldname;
                    metadata.size = file.size;
                    
                    processedFiles.push(metadata);
                }
            }
            
            // Attach processed file metadata to request
            req.processedFiles = processedFiles;
            req.fileMetadata = processedFiles; // Alias for backward compatibility
            
            next();
        } catch (error) {
            console.error('❌ Error processing uploaded files:', error);
            res.status(500).json({
                error: 'Error processing uploaded files',
                details: error.message
            });
        }
    };
};

/**
 * Error handler untuk multer errors
 */
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File terlalu besar',
                maxSize: '100MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Terlalu banyak file',
                maxFiles: 10
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Field file tidak dikenali'
            });
        }
    }
    
    if (error.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
            error: 'Tipe file tidak diizinkan',
            details: error.message
        });
    }
    
    next(error);
};

module.exports = {
    uploadConfigs,
    processUploadedFiles,
    handleMulterError,
    allowedTypes,
    sizeLimits
};
