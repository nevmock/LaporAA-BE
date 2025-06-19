const path = require("path");
const { v4: uuidv4 } = require("uuid");

/**
 * Generate a unique filename preserving the original file extension.
 * @param {string} originalName - The original filename.
 * @returns {string} - The new unique filename.
 */
function generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    const uniqueName = uuidv4() + ext;
    return uniqueName;
}

module.exports = {
    generateUniqueFilename,
};
