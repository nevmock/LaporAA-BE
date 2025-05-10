const turf = require("@turf/turf");
const fs = require("fs");
const path = require("path");

// Baca dan parse file GeoJSON
const geoDesa = JSON.parse(fs.readFileSync(path.join(__dirname, "Jawa-Barat-Geo-JSON", "Jabar_By_Desa.geojson")));
const geoKec = JSON.parse(fs.readFileSync(path.join(__dirname, "Jawa-Barat-Geo-JSON", "Jabar_By_Kec.geojson")));
const geoKab = JSON.parse(fs.readFileSync(path.join(__dirname, "Jawa-Barat-Geo-JSON", "Jabar_By_Kab.geojson")));

function findWilayahFromPoint(lat, lng) {
    const point = turf.point([lng, lat]);

    for (const feature of geoDesa.features) {
        if (turf.booleanPointInPolygon(point, feature)) {
            const p = feature.properties;
            return {
                desa: p.DESA || "-",
                kecamatan: p.KECAMATAN || "-",
                kabupaten: p.KABKOT || "-",
                source: "Desa"
            };
        }
    }

    for (const feature of geoKec.features) {
        if (turf.booleanPointInPolygon(point, feature)) {
            const p = feature.properties;
            return {
                desa: "-",
                kecamatan: p.KECAMATAN || "-",
                kabupaten: p.KABKOT || "-",
                source: "Kecamatan"
            };
        }
    }

    for (const feature of geoKab.features) {
        if (turf.booleanPointInPolygon(point, feature)) {
            const p = feature.properties;
            return {
                desa: "-",
                kecamatan: "-",
                kabupaten: p.KABKOT || "-",
                source: "Kabupaten"
            };
        }
    }

    return {
        desa: "-",
        kecamatan: "-",
        kabupaten: "-",
        source: "Tidak Diketahui"
    };
}

module.exports = { findWilayahFromPoint };