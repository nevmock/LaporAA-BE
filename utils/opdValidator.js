/**
 * Utility functions untuk validasi dan pembersihan data OPD
 */

/**
 * Membersihkan dan memvalidasi array OPD
 * @param {string|Array} opd - Input OPD (bisa string atau array)
 * @returns {Array} - Array OPD yang sudah dibersihkan
 */
function cleanOpdArray(opd) {
    let cleanedOpd = [];
    
    if (Array.isArray(opd)) {
        // Jika input adalah array
        cleanedOpd = opd
            .map(item => {
                if (item === null || item === undefined) return '';
                return String(item).trim();
            })
            .filter(item => item.length > 0); // Hapus string kosong
    } else if (opd !== null && opd !== undefined) {
        // Jika input adalah string atau tipe lain
        const cleanedString = String(opd).trim();
        if (cleanedString.length > 0) {
            cleanedOpd = [cleanedString];
        }
    }
    
    return cleanedOpd;
}

/**
 * Validasi apakah array OPD valid
 * @param {Array} opdArray - Array OPD untuk divalidasi
 * @returns {boolean} - True jika valid, false jika tidak
 */
function isValidOpdArray(opdArray) {
    if (!Array.isArray(opdArray)) {
        return false;
    }
    
    return opdArray.every(item => 
        typeof item === 'string' && 
        item.trim().length > 0
    );
}

/**
 * Validasi dan bersihkan OPD sekaligus
 * @param {string|Array} opd - Input OPD
 * @returns {Object} - { isValid: boolean, cleanedOpd: Array, errors: Array }
 */
function validateAndCleanOpd(opd) {
    const cleanedOpd = cleanOpdArray(opd);
    const isValid = isValidOpdArray(cleanedOpd);
    const errors = [];
    
    if (!isValid && cleanedOpd.length === 0 && opd) {
        errors.push('OPD tidak boleh berisi string kosong atau hanya spasi');
    }
    
    return {
        isValid: true, // Selalu valid karena kita sudah membersihkan
        cleanedOpd,
        errors
    };
}

module.exports = {
    cleanOpdArray,
    isValidOpdArray,
    validateAndCleanOpd
};
