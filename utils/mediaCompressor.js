const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs").promises;

/**
 * Compress media files (images, videos, voice notes)
 * @param {string} mediaUrl - Path to the media file
 * @param {string} mediaType - Type of media (image, video, voice)
 * @returns {Promise<string>} - Path to compressed file
 */
async function compressMedia(mediaUrl, mediaType) {
    if (!mediaUrl || !mediaType) {
        throw new Error("Media URL and type are required");
    }

    try {
        const inputPath = mediaUrl;
        const fileExtension = path.extname(inputPath);
        const baseName = path.basename(inputPath, fileExtension);
        const dirName = path.dirname(inputPath);
        
        switch (mediaType) {
            case "image":
                return await compressImage(inputPath, dirName, baseName);
            case "video":
                return await compressVideo(inputPath, dirName, baseName);
            case "voice":
            case "audio":
                return await compressAudio(inputPath, dirName, baseName);
            default:
                console.warn(`Unsupported media type for compression: ${mediaType}`);
                return mediaUrl; // Return original if type not supported
        }
    } catch (error) {
        console.error("Error compressing media:", error);
        return mediaUrl; // Return original file if compression fails
    }
}

/**
 * Compress image using Sharp
 * @param {string} inputPath - Input image path
 * @param {string} dirName - Directory name
 * @param {string} baseName - Base filename
 * @returns {Promise<string>} - Compressed image path
 */
async function compressImage(inputPath, dirName, baseName) {
    const outputPath = path.join(dirName, `${baseName}_compressed.jpg`);
    
    await sharp(inputPath)
        .resize(1200, 1200, { 
            fit: 'inside', 
            withoutEnlargement: true 
        })
        .jpeg({ 
            quality: 80,
            progressive: true,
            mozjpeg: true
        })
        .toFile(outputPath);
    
    // Check if compression was successful and file size reduced
    const originalStats = await fs.stat(inputPath);
    const compressedStats = await fs.stat(outputPath);
    
    if (compressedStats.size < originalStats.size) {
        console.log(`✅ Image compressed: ${originalStats.size} → ${compressedStats.size} bytes`);
        return outputPath;
    } else {
        // If compressed file is larger, delete it and return original
        await fs.unlink(outputPath);
        console.log("ℹ️ Original image is already optimized");
        return inputPath;
    }
}

/**
 * Compress video using FFmpeg
 * @param {string} inputPath - Input video path
 * @param {string} dirName - Directory name
 * @param {string} baseName - Base filename
 * @returns {Promise<string>} - Compressed video path
 */
async function compressVideo(inputPath, dirName, baseName) {
    const outputPath = path.join(dirName, `${baseName}_compressed.mp4`);
    
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .size('720x?') // Maintain aspect ratio, max width 720px
            .videoBitrate('1000k')
            .audioBitrate('128k')
            .format('mp4')
            .on('end', async () => {
                try {
                    // Check if compression was successful
                    const originalStats = await fs.stat(inputPath);
                    const compressedStats = await fs.stat(outputPath);
                    
                    if (compressedStats.size < originalStats.size) {
                        console.log(`✅ Video compressed: ${originalStats.size} → ${compressedStats.size} bytes`);
                        resolve(outputPath);
                    } else {
                        // If compressed file is larger, delete it and return original
                        await fs.unlink(outputPath);
                        console.log("ℹ️ Original video is already optimized");
                        resolve(inputPath);
                    }
                } catch (error) {
                    console.error("Error checking video compression:", error);
                    resolve(inputPath);
                }
            })
            .on('error', (err) => {
                console.error("Video compression error:", err);
                resolve(inputPath); // Return original on error
            })
            .save(outputPath);
    });
}

/**
 * Compress audio/voice using FFmpeg
 * @param {string} inputPath - Input audio path
 * @param {string} dirName - Directory name
 * @param {string} baseName - Base filename
 * @returns {Promise<string>} - Compressed audio path
 */
async function compressAudio(inputPath, dirName, baseName) {
    const outputPath = path.join(dirName, `${baseName}_compressed.mp3`);
    
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .audioCodec('mp3')
            .audioBitrate('64k') // Lower bitrate for voice notes
            .audioChannels(1) // Mono for voice notes
            .format('mp3')
            .on('end', async () => {
                try {
                    // Check if compression was successful
                    const originalStats = await fs.stat(inputPath);
                    const compressedStats = await fs.stat(outputPath);
                    
                    if (compressedStats.size < originalStats.size) {
                        console.log(`✅ Audio compressed: ${originalStats.size} → ${compressedStats.size} bytes`);
                        resolve(outputPath);
                    } else {
                        // If compressed file is larger, delete it and return original
                        await fs.unlink(outputPath);
                        console.log("ℹ️ Original audio is already optimized");
                        resolve(inputPath);
                    }
                } catch (error) {
                    console.error("Error checking audio compression:", error);
                    resolve(inputPath);
                }
            })
            .on('error', (err) => {
                console.error("Audio compression error:", err);
                resolve(inputPath); // Return original on error
            })
            .save(outputPath);
    });
}

/**
 * Get media file size in MB
 * @param {string} filePath - Path to file
 * @returns {Promise<number>} - File size in MB
 */
async function getFileSizeMB(filePath) {
    try {
        const stats = await fs.stat(filePath);
        return (stats.size / (1024 * 1024)).toFixed(2);
    } catch (error) {
        console.error("Error getting file size:", error);
        return 0;
    }
}

/**
 * Check if media needs compression based on size
 * @param {string} filePath - Path to file
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {Promise<boolean>} - True if compression needed
 */
async function needsCompression(filePath, maxSizeMB = 5) {
    const sizeMB = await getFileSizeMB(filePath);
    return sizeMB > maxSizeMB;
}

module.exports = {
    compressMedia,
    compressImage,
    compressVideo,
    compressAudio,
    getFileSizeMB,
    needsCompression
};
