const { validateAndCleanOpd } = require("../utils/opdValidator");

/**
 * Middleware untuk validasi dan pembersihan data OPD
 * Dapat digunakan di route yang menerima input OPD
 */
const validateOpdMiddleware = (req, res, next) => {
    if (req.body.opd !== undefined) {
        const { cleanedOpd, errors } = validateAndCleanOpd(req.body.opd);
        
        // Update req.body dengan data yang sudah dibersihkan
        req.body.opd = cleanedOpd;
        
        // Jika ada error (walau jarang karena kita membersihkan data)
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validasi OPD gagal",
                errors: errors
            });
        }
    }
    
    next();
};

module.exports = {
    validateOpdMiddleware
};
