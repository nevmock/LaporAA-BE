const fs = require('fs');
const path = require('path');

// Path ke file GeoJSON
const GEOJSON_PATH = path.join(__dirname, '../utils/Jawa-Barat-Geo-JSON');

/**
 * Controller untuk mengirim data GeoJSON Kabupaten Bekasi beserta kecamatan-kecamatannya
 */
const getKabupatenBekasiWithKecamatan = async (req, res) => {
    try {
        console.log('📍 Memuat data GeoJSON Kabupaten Bekasi...');
        
        // Baca file GeoJSON kecamatan
        const kecamatanFilePath = path.join(GEOJSON_PATH, 'Jabar_By_Kec.geojson');
        
        if (!fs.existsSync(kecamatanFilePath)) {
            return res.status(404).json({
                success: false,
                message: 'File GeoJSON kecamatan tidak ditemukan'
            });
        }
        
        // Baca dan parse data GeoJSON
        const rawData = fs.readFileSync(kecamatanFilePath, 'utf8');
        const geojsonData = JSON.parse(rawData);
        
        // Filter hanya kecamatan yang berada di Kabupaten Bekasi
        const bekasiFeaturesKecamatan = geojsonData.features.filter(feature => {
            const properties = feature.properties;
            // Filter berdasarkan KABKOT = "BEKASI" (bukan "KOTA BEKASI")
            return properties.KABKOT === "BEKASI";
        });
        
        console.log(`✅ Ditemukan ${bekasiFeaturesKecamatan.length} kecamatan di Kabupaten Bekasi`);
        
        // Buat response GeoJSON yang filtered
        const responseData = {
            type: "FeatureCollection",
            name: "Kabupaten_Bekasi_Kecamatan",
            crs: geojsonData.crs,
            features: bekasiFeaturesKecamatan
        };
        
        // Log detail kecamatan yang ditemukan
        const kecamatanNames = bekasiFeaturesKecamatan.map(f => f.properties.KECAMATAN);
        console.log('📋 Kecamatan di Kabupaten Bekasi:', kecamatanNames);
        
        res.status(200).json({
            success: true,
            message: 'Data GeoJSON Kabupaten Bekasi berhasil dimuat',
            data: responseData,
            meta: {
                total_kecamatan: bekasiFeaturesKecamatan.length,
                kecamatan_list: kecamatanNames,
                kabupaten: "BEKASI"
            }
        });
        
    } catch (error) {
        console.error('❌ Error saat memuat GeoJSON Kabupaten Bekasi:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memuat data GeoJSON',
            error: error.message
        });
    }
};

/**
 * Controller untuk mengirim data GeoJSON kecamatan tertentu di Kabupaten Bekasi
 */
const getKecamatanByName = async (req, res) => {
    try {
        const { kecamatan } = req.params;
        
        if (!kecamatan) {
            return res.status(400).json({
                success: false,
                message: 'Nama kecamatan harus disediakan'
            });
        }
        
        console.log(`📍 Mencari kecamatan: ${kecamatan} di Kabupaten Bekasi...`);
        
        // Baca file GeoJSON kecamatan
        const kecamatanFilePath = path.join(GEOJSON_PATH, 'Jabar_By_Kec.geojson');
        
        if (!fs.existsSync(kecamatanFilePath)) {
            return res.status(404).json({
                success: false,
                message: 'File GeoJSON kecamatan tidak ditemukan'
            });
        }
        
        // Baca dan parse data GeoJSON
        const rawData = fs.readFileSync(kecamatanFilePath, 'utf8');
        const geojsonData = JSON.parse(rawData);
        
        // Filter kecamatan spesifik di Kabupaten Bekasi
        const targetKecamatan = geojsonData.features.find(feature => {
            const properties = feature.properties;
            return properties.KABKOT === "BEKASI" && 
                   properties.KECAMATAN.toLowerCase() === kecamatan.toLowerCase();
        });
        
        if (!targetKecamatan) {
            return res.status(404).json({
                success: false,
                message: `Kecamatan ${kecamatan} tidak ditemukan di Kabupaten Bekasi`
            });
        }
        
        console.log(`✅ Kecamatan ${kecamatan} ditemukan`);
        
        // Buat response GeoJSON untuk kecamatan spesifik
        const responseData = {
            type: "FeatureCollection",
            name: `Kecamatan_${kecamatan}_Kabupaten_Bekasi`,
            crs: geojsonData.crs,
            features: [targetKecamatan]
        };
        
        res.status(200).json({
            success: true,
            message: `Data GeoJSON Kecamatan ${kecamatan} berhasil dimuat`,
            data: responseData,
            meta: {
                kecamatan: targetKecamatan.properties.KECAMATAN,
                kabupaten: targetKecamatan.properties.KABKOT,
                provinsi: targetKecamatan.properties.PROV
            }
        });
        
    } catch (error) {
        console.error('❌ Error saat memuat GeoJSON kecamatan:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memuat data kecamatan',
            error: error.message
        });
    }
};

/**
 * Controller untuk mendapatkan daftar nama kecamatan di Kabupaten Bekasi
 */
const getKecamatanList = async (req, res) => {
    try {
        console.log('📍 Mengambil daftar kecamatan di Kabupaten Bekasi...');
        
        // Baca file GeoJSON kecamatan
        const kecamatanFilePath = path.join(GEOJSON_PATH, 'Jabar_By_Kec.geojson');
        
        if (!fs.existsSync(kecamatanFilePath)) {
            return res.status(404).json({
                success: false,
                message: 'File GeoJSON kecamatan tidak ditemukan'
            });
        }
        
        // Baca dan parse data GeoJSON
        const rawData = fs.readFileSync(kecamatanFilePath, 'utf8');
        const geojsonData = JSON.parse(rawData);
        
        // Filter dan ambil nama kecamatan di Kabupaten Bekasi
        const bekasiFeaturesKecamatan = geojsonData.features.filter(feature => {
            return feature.properties.KABKOT === "BEKASI";
        });
        
        const kecamatanList = bekasiFeaturesKecamatan.map((feature, index) => ({
            id: index + 1,
            kecamatan: feature.properties.KECAMATAN,
            kabupaten: feature.properties.KABKOT,
            provinsi: feature.properties.PROV
        }));
        
        console.log(`✅ Ditemukan ${kecamatanList.length} kecamatan di Kabupaten Bekasi`);
        
        res.status(200).json({
            success: true,
            message: 'Daftar kecamatan Kabupaten Bekasi berhasil dimuat',
            data: kecamatanList,
            meta: {
                total: kecamatanList.length,
                kabupaten: "BEKASI",
                provinsi: "JAWA BARAT"
            }
        });
        
    } catch (error) {
        console.error('❌ Error saat mengambil daftar kecamatan:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil daftar kecamatan',
            error: error.message
        });
    }
};

module.exports = {
    getKabupatenBekasiWithKecamatan,
    getKecamatanByName,
    getKecamatanList
};
