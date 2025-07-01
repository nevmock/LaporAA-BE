const Tindakan = require("../models/Tindakan");
const { cleanOpdArray } = require("../utils/opdValidator");

exports.update = async ({ reportId, hasil, trackingId, prioritas, situasi, status, opd, photos, url, keterangan, status_laporan, tag }) => {
    const tindakan = await Tindakan.findOne({ report: reportId });
    if (!tindakan) throw new Error("Tindakan belum tersedia untuk report ini.");

    tindakan.hasil = hasil;
    tindakan.trackingId = trackingId;
    tindakan.prioritas = prioritas;
    tindakan.situasi = situasi;
    tindakan.status = status;
    // Validasi dan bersihkan array OPD menggunakan utility
    tindakan.opd = cleanOpdArray(opd);
    tindakan.photos = photos;
    tindakan.updatedAt = new Date();
    tindakan.url = url;
    tindakan.keterangan = keterangan;
    tindakan.status_laporan = status_laporan;
    
    // Update tags if provided
    if (tag) {
        // Convert simple strings to objects if needed
        if (Array.isArray(tag)) {
            const formattedTags = tag.map(t => {
                if (typeof t === 'string') {
                    return { hash_tag: t };
                } else if (typeof t === 'object' && t.hash_tag) {
                    return { hash_tag: t.hash_tag };
                }
                return t; // Use as is if already in correct format
            });
            tindakan.tag = formattedTags;
        }
    }

    await tindakan.save();
    return tindakan;
};

exports.appendKesimpulan = async (tindakanId, newText) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");

    tindakan.kesimpulan.push({
        text: newText,
        timestamp: new Date(),
    });

    tindakan.updatedAt = new Date();
    await tindakan.save();

    return tindakan;
};

exports.updateKesimpulanByIndex = async (tindakanId, index, newText) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");

    if (!tindakan.kesimpulan || index < 0 || index >= tindakan.kesimpulan.length) {
        throw new Error("Index kesimpulan tidak valid.");
    }

    tindakan.kesimpulan[index].text = newText;
    tindakan.kesimpulan[index].timestamp = new Date();
    tindakan.updatedAt = new Date();

    await tindakan.save();
    return tindakan;
};

exports.deleteKesimpulanByIndex = async (tindakanId, index) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");

    if (!tindakan.kesimpulan || index < 0 || index >= tindakan.kesimpulan.length) {
        throw new Error("Index kesimpulan tidak valid.");
    }

    tindakan.kesimpulan.splice(index, 1);
    tindakan.updatedAt = new Date();

    await tindakan.save();
    return tindakan;
};

exports.findByReportId = async (reportId) => {
    return await Tindakan.find({ report: reportId });
};

exports.findById = async (id) => {
    return await Tindakan.findById(id).populate("report");
};

exports.findAll = async (query) => {
    return await Tindakan.find(query).populate("report");
};

exports.updateRatingById = async (tindakanId, rating) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");

    tindakan.rating = rating;
    tindakan.updatedAt = new Date();
    await tindakan.save();

    return tindakan;
};

// Add a tag to tindakan
exports.addTag = async (tindakanId, hashTag) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");
    
    // Check if tag already exists to prevent duplicates
    const tagExists = tindakan.tag.some(t => t.hash_tag === hashTag);
    if (!tagExists) {
        tindakan.tag.push({ hash_tag: hashTag });
        tindakan.updatedAt = new Date();
        await tindakan.save();
    }
    
    return tindakan;
};

// Remove a tag from tindakan
exports.removeTag = async (tindakanId, hashTag) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");
    
    // Filter out the tag with matching hash_tag
    const initialLength = tindakan.tag.length;
    tindakan.tag = tindakan.tag.filter(t => t.hash_tag !== hashTag);
    
    // Only save if a tag was actually removed
    if (tindakan.tag.length !== initialLength) {
        tindakan.updatedAt = new Date();
        await tindakan.save();
    }
    
    return tindakan;
};

// Update tags list completely
exports.updateTags = async (tindakanId, tags) => {
    const tindakan = await Tindakan.findById(tindakanId);
    if (!tindakan) throw new Error("Tindakan tidak ditemukan.");
    
    // Validate tags format
    if (!Array.isArray(tags)) {
        throw new Error("Tags harus berupa array");
    }
    
    // Convert simple strings to objects if needed
    const formattedTags = tags.map(tag => {
        if (typeof tag === 'string') {
            return { hash_tag: tag };
        } else if (typeof tag === 'object' && tag.hash_tag) {
            return { hash_tag: tag.hash_tag };
        } else {
            throw new Error("Format tag tidak valid");
        }
    });
    
    tindakan.tag = formattedTags;
    tindakan.updatedAt = new Date();
    await tindakan.save();
    
    return tindakan;
};

// Find all unique tags in the system
exports.findAllUniqueTags = async () => {
    const result = await Tindakan.aggregate([
        // Unwind the tag array to make each tag a separate document
        { $unwind: { path: "$tag", preserveNullAndEmptyArrays: false } },
        // Group by hash_tag to get unique values
        { $group: { _id: "$tag.hash_tag", count: { $sum: 1 } } },
        // Sort by tag usage count in descending order
        { $sort: { count: -1 } },
        // Project to get a cleaner output format
        { $project: { _id: 0, hash_tag: "$_id", count: 1 } }
    ]);
    
    return result;
};

// Find tindakan by tag
exports.findByTag = async (hashTag) => {
    return await Tindakan.find({ 'tag.hash_tag': hashTag })
        .populate("report")
        .sort({ updatedAt: -1 });
};

// Search for tags that match a partial string
exports.searchTags = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
        // If no search query provided, return all tags (limited to top 20)
        return await this.findAllUniqueTags().then(tags => tags.slice(0, 20));
    }
    
    // Escape special characters for regex
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const result = await Tindakan.aggregate([
        // Unwind the tag array to make each tag a separate document
        { $unwind: { path: "$tag", preserveNullAndEmptyArrays: false } },
        // Filter for tags that match the search query (case insensitive)
        { $match: { "tag.hash_tag": { $regex: escapedQuery, $options: "i" } } },
        // Group by hash_tag to get unique values
        { $group: { _id: "$tag.hash_tag", count: { $sum: 1 } } },
        // Sort by tag usage count in descending order
        { $sort: { count: -1 } },
        // Limit to 10 results for efficiency
        { $limit: 10 },
        // Project to get a cleaner output format
        { $project: { _id: 0, hash_tag: "$_id", count: 1 } }
    ]);
    
    return result;
};