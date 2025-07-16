const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Asset Manager untuk mengelola file uploads dengan struktur yang terorganisir
 * Mendukung model database baru dengan metadata lengkap
 */
class AssetManager {
    constructor() {
        this.baseDir = path.join(__dirname, '../public');
        this.uploadsDir = path.join(this.baseDir, 'uploads');
        this.tindakanDir = path.join(this.baseDir, 'uploadsTindakan');
        
        // Struktur folder untuk berbagai jenis konten
        this.folderStructure = {
            reports: {
                base: this.uploadsDir,
                subfolders: ['images', 'videos', 'audio', 'documents']
            },
            tindakan: {
                base: this.tindakanDir,
                subfolders: ['evidence', 'documents', 'photos']
            },
            assets: {
                base: path.join(this.baseDir, 'assets'),
                subfolders: ['tutorials', 'icons', 'templates']
            }
        };
        
        this.init();
    }
    
    /**
     * Initialize folder structure
     */
    init() {
        try {
            // Create main directories
            Object.values(this.folderStructure).forEach(folder => {
                if (!fs.existsSync(folder.base)) {
                    fs.mkdirSync(folder.base, { recursive: true });
                    console.log(`📁 Created directory: ${folder.base}`);
                }
                
                // Create subfolders
                folder.subfolders.forEach(subfolder => {
                    const subfolderPath = path.join(folder.base, subfolder);
                    if (!fs.existsSync(subfolderPath)) {
                        fs.mkdirSync(subfolderPath, { recursive: true });
                        console.log(`📁 Created subdirectory: ${subfolderPath}`);
                    }
                });
            });
            
            console.log('✅ Asset manager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing asset manager:', error);
        }
    }
    
    /**
     * Generate organized file path based on type and content
     */
    generateFilePath(fileType, contentType, originalName) {
        const timestamp = Date.now();
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
        
        let folder, subfolder;
        
        // Determine folder structure
        if (contentType === 'report') {
            folder = this.folderStructure.reports.base;
            subfolder = this.getSubfolderByFileType(fileType);
        } else if (contentType === 'tindakan') {
            folder = this.folderStructure.tindakan.base;
            subfolder = 'evidence'; // Default for tindakan files
        } else {
            folder = this.folderStructure.assets.base;
            subfolder = 'uploads';
        }
        
        const fileName = `${timestamp}-${sanitizedName}${extension}`;
        const fullPath = path.join(folder, subfolder, fileName);
        const relativePath = path.relative(this.baseDir, fullPath);
        
        return {
            fullPath,
            relativePath: relativePath.replace(/\\/g, '/'), // Normalize for web URLs
            fileName,
            folder: subfolder,
            type: fileType
        };
    }
    
    /**
     * Get subfolder based on file type
     */
    getSubfolderByFileType(mimeType) {
        if (mimeType.startsWith('image/')) return 'images';
        if (mimeType.startsWith('video/')) return 'videos';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'documents';
    }
    
    /**
     * Process uploaded file and generate metadata
     */
    async processUploadedFile(filePath, originalName, mimeType, contentType = 'report') {
        try {
            const stats = fs.statSync(filePath);
            const targetPath = this.generateFilePath(mimeType, contentType, originalName);
            
            // Move file to organized location
            fs.mkdirSync(path.dirname(targetPath.fullPath), { recursive: true });
            fs.renameSync(filePath, targetPath.fullPath);
            
            // Generate metadata
            const metadata = {
                url: `/${targetPath.relativePath}`,
                type: this.getAssetType(mimeType),
                caption: '',
                originalUrl: `/${targetPath.relativePath}`,
                fileSize: stats.size,
                mimeType: mimeType,
                originalName: originalName,
                uploadedAt: new Date(),
                folder: targetPath.folder
            };
            
            // Generate thumbnails for images
            if (mimeType.startsWith('image/')) {
                await this.generateThumbnails(targetPath.fullPath, targetPath.relativePath);
            }
            
            console.log(`✅ File processed: ${originalName} -> ${targetPath.relativePath}`);
            return metadata;
            
        } catch (error) {
            console.error('❌ Error processing file:', error);
            throw error;
        }
    }
    
    /**
     * Generate thumbnails for images
     */
    async generateThumbnails(imagePath, relativePath) {
        try {
            const dir = path.dirname(imagePath);
            const ext = path.extname(imagePath);
            const name = path.basename(imagePath, ext);
            
            // Generate different sizes
            const sizes = [
                { suffix: '_thumb', width: 150, height: 150 },
                { suffix: '_medium', width: 400, height: 300 },
                { suffix: '_large', width: 800, height: 600 }
            ];
            
            for (const size of sizes) {
                const thumbPath = path.join(dir, `${name}${size.suffix}${ext}`);
                await sharp(imagePath)
                    .resize(size.width, size.height, { 
                        fit: 'inside',
                        withoutEnlargement: true 
                    })
                    .jpeg({ quality: 80 })
                    .toFile(thumbPath);
            }
            
            console.log(`🖼️ Thumbnails generated for: ${relativePath}`);
        } catch (error) {
            console.error('❌ Error generating thumbnails:', error);
        }
    }
    
    /**
     * Get asset type for database
     */
    getAssetType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'document';
    }
    
    /**
     * Clean up old or orphaned files
     */
    async cleanupOrphanedFiles(activeFiles) {
        try {
            const allFolders = [
                this.folderStructure.reports.base,
                this.folderStructure.tindakan.base
            ];
            
            for (const folder of allFolders) {
                await this.scanAndCleanupFolder(folder, activeFiles);
            }
            
            console.log('🧹 Cleanup completed');
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }
    
    /**
     * Scan folder and remove orphaned files
     */
    async scanAndCleanupFolder(folderPath, activeFiles) {
        const files = fs.readdirSync(folderPath, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = path.join(folderPath, file.name);
            
            if (file.isDirectory()) {
                await this.scanAndCleanupFolder(fullPath, activeFiles);
            } else {
                const relativePath = path.relative(this.baseDir, fullPath).replace(/\\/g, '/');
                const webPath = `/${relativePath}`;
                
                if (!activeFiles.includes(webPath)) {
                    // Check if file is old enough to be considered orphaned
                    const stats = fs.statSync(fullPath);
                    const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
                    
                    if (ageInHours > 24) { // Only remove files older than 24 hours
                        fs.unlinkSync(fullPath);
                        console.log(`🗑️ Removed orphaned file: ${webPath}`);
                    }
                }
            }
        }
    }
    
    /**
     * Get file statistics
     */
    getFileStats() {
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            byType: {
                images: { count: 0, size: 0 },
                videos: { count: 0, size: 0 },
                audio: { count: 0, size: 0 },
                documents: { count: 0, size: 0 }
            }
        };
        
        const scanFolder = (folderPath) => {
            if (!fs.existsSync(folderPath)) return;
            
            const files = fs.readdirSync(folderPath, { withFileTypes: true });
            
            for (const file of files) {
                const fullPath = path.join(folderPath, file.name);
                
                if (file.isDirectory()) {
                    scanFolder(fullPath);
                } else {
                    const fileStats = fs.statSync(fullPath);
                    stats.totalFiles++;
                    stats.totalSize += fileStats.size;
                    
                    // Categorize by folder name
                    const folder = path.basename(path.dirname(fullPath));
                    if (stats.byType[folder]) {
                        stats.byType[folder].count++;
                        stats.byType[folder].size += fileStats.size;
                    }
                }
            }
        };
        
        scanFolder(this.uploadsDir);
        scanFolder(this.tindakanDir);
        
        return stats;
    }
}

module.exports = new AssetManager();
