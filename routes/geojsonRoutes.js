const express = require('express');
const router = express.Router();
const geojsonController = require('../controllers/geojsonController');

/**
 * @route GET /api/geojson/kabupaten-bekasi
 * @desc Mendapatkan data GeoJSON Kabupaten Bekasi beserta semua kecamatannya
 * @access Public
 */
router.get('/kabupaten-bekasi', geojsonController.getKabupatenBekasiWithKecamatan);

/**
 * @route GET /api/geojson/kabupaten-bekasi/kecamatan/:kecamatan
 * @desc Mendapatkan data GeoJSON kecamatan tertentu di Kabupaten Bekasi
 * @access Public
 * @param {string} kecamatan - Nama kecamatan
 */
router.get('/kabupaten-bekasi/kecamatan/:kecamatan', geojsonController.getKecamatanByName);

/**
 * @route GET /api/geojson/kabupaten-bekasi/kecamatan-list
 * @desc Mendapatkan daftar nama semua kecamatan di Kabupaten Bekasi
 * @access Public
 */
router.get('/kabupaten-bekasi/kecamatan-list', geojsonController.getKecamatanList);

module.exports = router;
