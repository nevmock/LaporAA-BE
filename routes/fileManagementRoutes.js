const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const multer = require("multer");

// Helper function to get file stats
const getFileStats = async (filePath, relativePath) => {
  try {
    const stats = await fs.stat(filePath);
    const isDirectory = stats.isDirectory();
    
    return {
      id: Buffer.from(relativePath).toString('base64'),
      name: path.basename(relativePath),
      type: isDirectory ? 'folder' : 'file',
      size: isDirectory ? 0 : stats.size,
      mimeType: isDirectory ? 'folder' : getMimeType(relativePath),
      path: relativePath,
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
      url: isDirectory ? null : relativePath,
      thumbnail: await generateThumbnail(filePath, relativePath)
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    return null;
  }
};

// Get MIME type based on file extension
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.avi': 'video/avi',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.json': 'application/json'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

// Generate thumbnail for images (basic implementation)
const generateThumbnail = async (filePath, relativePath) => {
  try {
    const mimeType = getMimeType(relativePath);
    if (mimeType.startsWith('image/')) {
      // For now, just return the original image URL
      // In a real implementation, you'd generate actual thumbnails
      return relativePath;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Calculate directory size recursively
const calculateDirectorySize = async (dirPath) => {
  let size = 0;
  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        size += await calculateDirectorySize(itemPath);
      } else {
        size += stats.size;
      }
    }
  } catch (error) {
    console.error('Error calculating directory size:', error);
  }
  return size;
};

// Get files related to specific user from message database
const getUserRelatedFiles = async (userId) => {
  try {
    // Import message model
    const Message = require('../models/messageModel');
    
    // Get all messages for this user that have media
    const messages = await Message.find({
      from: userId,
      $or: [
        { type: 'image' },
        { type: 'video' },
        { type: 'audio' },
        { type: 'document' },
        { type: 'voice' },
        { type: 'sticker' }
      ],
      mediaUrl: { $exists: true, $ne: null }
    }).sort({ timestamp: -1 });
    
    // Convert to file format
    const userFiles = messages.map(msg => ({
      id: msg._id.toString(),
      name: msg.message || path.basename(msg.mediaUrl || ''),
      type: 'file',
      size: 0, // Will be calculated from actual file
      mimeType: getMimeTypeFromMessage(msg.type),
      path: msg.mediaUrl,
      createdAt: msg.timestamp,
      updatedAt: msg.timestamp,
      url: msg.mediaUrl,
      thumbnail: msg.mediaUrl,
      userId: msg.from,
      messageId: msg._id
    }));
    
    return userFiles;
  } catch (error) {
    console.error('Error getting user related files:', error);
    return [];
  }
};

// Convert message type to MIME type
const getMimeTypeFromMessage = (messageType) => {
  const typeMap = {
    'image': 'image/jpeg',
    'video': 'video/mp4',
    'audio': 'audio/mpeg',
    'voice': 'audio/mpeg',
    'document': 'application/pdf',
    'sticker': 'image/webp'
  };
  return typeMap[messageType] || 'application/octet-stream';
};

// GET /api/files - List files in a directory (with user filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      path: requestPath = '/', 
      search = '', 
      filter = 'all', 
      sort = 'name', 
      order = 'asc',
      limit = 100,
      offset = 0,
      userId = null // Add userId parameter for filtering
    } = req.query;

    // If userId is provided, get files from message database instead
    if (userId) {
      const userFiles = await getUserRelatedFiles(userId);
      
      // Apply filters
      let filteredFiles = userFiles;
      
      // Apply search filter
      if (search) {
        filteredFiles = filteredFiles.filter(file => 
          file.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply type filter
      if (filter !== 'all') {
        filteredFiles = filteredFiles.filter(file => {
          switch (filter) {
            case 'images':
              return file.mimeType.startsWith('image/');
            case 'videos':
              return file.mimeType.startsWith('video/');
            case 'audio':
              return file.mimeType.startsWith('audio/');
            case 'documents':
              return file.mimeType.includes('pdf') || 
                     file.mimeType.includes('document') || 
                     file.mimeType.includes('sheet');
            default:
              return true;
          }
        });
      }

      // Apply sorting
      filteredFiles.sort((a, b) => {
        let comparison = 0;
        switch (sort) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'date':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'type':
            comparison = a.mimeType.localeCompare(b.mimeType);
            break;
        }
        return order === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

      return res.json({
        files: paginatedFiles,
        total: filteredFiles.length,
        hasMore: endIndex < filteredFiles.length,
        currentPath: `Messages for ${userId}`
      });
    }

    // Security: Prevent directory traversal
    const safePath = path.normalize(requestPath).replace(/^(\.\.[\/\\])+/, '');
    const baseDir = path.join(__dirname, '../public');
    const targetDir = path.join(baseDir, safePath);

    // Check if directory exists
    if (!fsSync.existsSync(targetDir)) {
      return res.status(404).json({ error: 'Directory not found' });
    }

    // Read directory contents
    const items = await fs.readdir(targetDir);
    const files = [];

    for (const item of items) {
      const itemPath = path.join(targetDir, item);
      const relativePath = path.posix.join(safePath, item).replace(/\\/g, '/');
      
      const fileInfo = await getFileStats(itemPath, relativePath);
      if (fileInfo) {
        files.push(fileInfo);
      }
    }

    // Apply search filter
    let filteredFiles = files;
    if (search) {
      filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply type filter
    if (filter !== 'all') {
      filteredFiles = filteredFiles.filter(file => {
        switch (filter) {
          case 'images':
            return file.mimeType.startsWith('image/');
          case 'videos':
            return file.mimeType.startsWith('video/');
          case 'audio':
            return file.mimeType.startsWith('audio/');
          case 'documents':
            return file.mimeType.includes('pdf') || 
                   file.mimeType.includes('document') || 
                   file.mimeType.includes('sheet') ||
                   file.mimeType.includes('word') ||
                   file.mimeType.includes('excel');
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filteredFiles.sort((a, b) => {
      let comparison = 0;
      
      // Folders first
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      
      switch (sort) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.updatedAt) - new Date(b.updatedAt);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.mimeType.localeCompare(b.mimeType);
          break;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

    res.json({
      files: paginatedFiles,
      total: filteredFiles.length,
      hasMore: endIndex < filteredFiles.length,
      currentPath: safePath
    });

  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// GET /api/files/stats - Get storage statistics
router.get('/stats', async (req, res) => {
  try {
    const baseDir = path.join(__dirname, '../public');
    const uploadsDir = path.join(baseDir, 'uploads');
    const assetsDir = path.join(baseDir, 'assets');
    const uploadsTindakanDir = path.join(baseDir, 'uploadsTindakan');

    // Calculate sizes
    const uploadsSize = fsSync.existsSync(uploadsDir) ? await calculateDirectorySize(uploadsDir) : 0;
    const assetsSize = fsSync.existsSync(assetsDir) ? await calculateDirectorySize(assetsDir) : 0;
    const tindakanSize = fsSync.existsSync(uploadsTindakanDir) ? await calculateDirectorySize(uploadsTindakanDir) : 0;
    
    const usedSize = uploadsSize + assetsSize + tindakanSize;
    const totalSize = 10 * 1024 * 1024 * 1024; // 10GB limit
    const availableSize = totalSize - usedSize;

    // Count files by type
    const countFiles = async (dirPath) => {
      const counts = {
        fileCount: 0,
        folderCount: 0,
        images: 0,
        videos: 0,
        audio: 0,
        documents: 0,
        others: 0
      };

      if (!fsSync.existsSync(dirPath)) return counts;

      const processDirectory = async (currentPath) => {
        try {
          const items = await fs.readdir(currentPath);
          
          for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stats = await fs.stat(itemPath);
            
            if (stats.isDirectory()) {
              counts.folderCount++;
              await processDirectory(itemPath);
            } else {
              counts.fileCount++;
              const mimeType = getMimeType(item);
              
              if (mimeType.startsWith('image/')) {
                counts.images += stats.size;
              } else if (mimeType.startsWith('video/')) {
                counts.videos += stats.size;
              } else if (mimeType.startsWith('audio/')) {
                counts.audio += stats.size;
              } else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet')) {
                counts.documents += stats.size;
              } else {
                counts.others += stats.size;
              }
            }
          }
        } catch (error) {
          console.error('Error processing directory:', error);
        }
      };

      await processDirectory(dirPath);
      return counts;
    };

    // Count files in all directories
    const uploadsCounts = await countFiles(uploadsDir);
    const assetsCounts = await countFiles(assetsDir);
    const tindakanCounts = await countFiles(uploadsTindakanDir);

    const totalFileCount = uploadsCounts.fileCount + assetsCounts.fileCount + tindakanCounts.fileCount;
    const totalFolderCount = uploadsCounts.folderCount + assetsCounts.folderCount + tindakanCounts.folderCount;

    const breakdown = {
      images: uploadsCounts.images + assetsCounts.images + tindakanCounts.images,
      videos: uploadsCounts.videos + assetsCounts.videos + tindakanCounts.videos,
      audio: uploadsCounts.audio + assetsCounts.audio + tindakanCounts.audio,
      documents: uploadsCounts.documents + assetsCounts.documents + tindakanCounts.documents,
      others: uploadsCounts.others + assetsCounts.others + tindakanCounts.others
    };

    res.json({
      totalSize,
      usedSize,
      availableSize,
      fileCount: totalFileCount,
      folderCount: totalFolderCount,
      breakdown,
      directories: {
        uploads: {
          size: uploadsSize,
          fileCount: uploadsCounts.fileCount,
          folderCount: uploadsCounts.folderCount
        },
        assets: {
          size: assetsSize,
          fileCount: assetsCounts.fileCount,
          folderCount: assetsCounts.folderCount
        },
        uploadsTindakan: {
          size: tindakanSize,
          fileCount: tindakanCounts.fileCount,
          folderCount: tindakanCounts.folderCount
        }
      }
    });

  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({ error: 'Failed to get storage statistics' });
  }
});

// DELETE /api/files/:fileId - Delete a file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Decode file path from base64 ID
    const filePath = Buffer.from(fileId, 'base64').toString();
    const baseDir = path.join(__dirname, '../public');
    const targetFile = path.join(baseDir, filePath);

    // Security: Ensure file is within allowed directories
    const normalizedPath = path.normalize(targetFile);
    if (!normalizedPath.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fsSync.existsSync(targetFile)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file or directory
    const stats = await fs.stat(targetFile);
    if (stats.isDirectory()) {
      await fs.rmdir(targetFile, { recursive: true });
    } else {
      await fs.unlink(targetFile);
    }

    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// POST /api/files/bulk-delete - Delete multiple files
router.post('/bulk-delete', async (req, res) => {
  try {
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'Invalid file IDs array' });
    }

    const results = {
      successful: [],
      failed: []
    };

    const baseDir = path.join(__dirname, '../public');

    for (const fileId of fileIds) {
      try {
        // Decode file path from base64 ID
        const filePath = Buffer.from(fileId, 'base64').toString();
        const targetFile = path.join(baseDir, filePath);

        // Security: Ensure file is within allowed directories
        const normalizedPath = path.normalize(targetFile);
        if (!normalizedPath.startsWith(baseDir)) {
          results.failed.push({ fileId, error: 'Access denied' });
          continue;
        }

        // Check if file exists
        if (!fsSync.existsSync(targetFile)) {
          results.failed.push({ fileId, error: 'File not found' });
          continue;
        }

        // Delete file or directory
        const stats = await fs.stat(targetFile);
        if (stats.isDirectory()) {
          await fs.rmdir(targetFile, { recursive: true });
        } else {
          await fs.unlink(targetFile);
        }

        results.successful.push(fileId);

      } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
        results.failed.push({ fileId, error: error.message });
      }
    }

    res.json({
      message: `Bulk delete completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      results
    });

  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ error: 'Failed to perform bulk delete' });
  }
});

// POST /api/files/cleanup - Clean up old files
router.post('/cleanup', async (req, res) => {
  try {
    const { olderThanDays = 30, fileTypes = [], dryRun = true } = req.body;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const baseDir = path.join(__dirname, '../public');
    const directories = ['uploads', 'uploadsTindakan'];
    
    const results = {
      scanned: 0,
      deleted: 0,
      failed: 0,
      totalSizeReclaimed: 0,
      files: []
    };

    const processDirectory = async (dirPath) => {
      if (!fsSync.existsSync(dirPath)) return;

      try {
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory()) {
            await processDirectory(itemPath);
          } else {
            results.scanned++;
            
            // Check if file is older than cutoff date
            if (stats.mtime < cutoffDate) {
              // Check file type filter
              if (fileTypes.length > 0) {
                const mimeType = getMimeType(item);
                const matchesFilter = fileTypes.some(type => {
                  switch (type) {
                    case 'images': return mimeType.startsWith('image/');
                    case 'videos': return mimeType.startsWith('video/');
                    case 'audio': return mimeType.startsWith('audio/');
                    case 'documents': return mimeType.includes('pdf') || mimeType.includes('document');
                    default: return false;
                  }
                });
                
                if (!matchesFilter) continue;
              }
              
              const fileInfo = {
                path: itemPath,
                relativePath: path.relative(baseDir, itemPath),
                size: stats.size,
                mtime: stats.mtime
              };
              
              results.files.push(fileInfo);
              results.totalSizeReclaimed += stats.size;
              
              if (!dryRun) {
                try {
                  await fs.unlink(itemPath);
                  results.deleted++;
                } catch (error) {
                  console.error(`Failed to delete ${itemPath}:`, error);
                  results.failed++;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing directory:', error);
      }
    };

    // Process each directory
    for (const dir of directories) {
      const dirPath = path.join(baseDir, dir);
      await processDirectory(dirPath);
    }

    res.json({
      message: dryRun 
        ? `Cleanup scan completed. ${results.files.length} files would be deleted.`
        : `Cleanup completed. ${results.deleted} files deleted.`,
      dryRun,
      results
    });

  } catch (error) {
    console.error('Error in cleanup:', error);
    res.status(500).json({ error: 'Failed to perform cleanup' });
  }
});

// POST /api/files/mkdir - Create a new directory
router.post('/mkdir', async (req, res) => {
  try {
    const { path: dirPath, name } = req.body;

    if (!name || !dirPath) {
      return res.status(400).json({ error: 'Directory path and name are required' });
    }

    // Security: Prevent directory traversal
    const safePath = path.normalize(dirPath).replace(/^(\.\.[\/\\])+/, '');
    const baseDir = path.join(__dirname, '../public');
    const targetDir = path.join(baseDir, safePath, name);

    // Check if directory already exists
    if (fsSync.existsSync(targetDir)) {
      return res.status(409).json({ error: 'Directory already exists' });
    }

    // Create directory
    await fs.mkdir(targetDir, { recursive: true });

    res.json({ 
      message: 'Directory created successfully',
      path: path.posix.join(safePath, name).replace(/\\/g, '/')
    });

  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({ error: 'Failed to create directory' });
  }
});

module.exports = router;
