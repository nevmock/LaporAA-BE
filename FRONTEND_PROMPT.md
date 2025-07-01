# 🗺️ API Documentation: GeoJSON Kabupaten Bekasi

## Base URL
```
http://localhost:3001
```

## Available Endpoints

### 1. GET `/geojson/kabupaten-bekasi`
**Deskripsi**: Mendapatkan data GeoJSON lengkap Kabupaten Bekasi beserta semua kecamatannya

**Response Structure**:
```json
{
  "success": true,
  "message": "Data GeoJSON Kabupaten Bekasi berhasil dimuat",
  "data": {
    "type": "FeatureCollection",
    "name": "Kabupaten_Bekasi_Kecamatan",
    "crs": {
      "type": "name",
      "properties": {
        "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
      }
    },
    "features": [
      {
        "type": "Feature",
        "properties": {
          "KECAMATAN": "BABELAN",
          "KABKOT": "BEKASI",
          "PROV": "JAWA BARAT",
          "NEGARA": "INDONESIA"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[longitude, latitude], ...]]
        }
      }
      // ... more features
    ]
  },
  "meta": {
    "total_kecamatan": 23,
    "kecamatan_list": ["BABELAN", "CABANGBUNGIN", "CIBARUSAH", ...],
    "kabupaten": "BEKASI"
  }
}
```

### 2. GET `/geojson/kabupaten-bekasi/kecamatan-list`
**Deskripsi**: Mendapatkan daftar nama kecamatan saja (tanpa data GeoJSON)

**Response Structure**:
```json
{
  "success": true,
  "message": "Daftar kecamatan Kabupaten Bekasi berhasil dimuat",
  "data": [
    {
      "id": 1,
      "kecamatan": "BABELAN",
      "kabupaten": "BEKASI",
      "provinsi": "JAWA BARAT"
    },
    {
      "id": 2,
      "kecamatan": "CABANGBUNGIN",
      "kabupaten": "BEKASI",
      "provinsi": "JAWA BARAT"
    }
    // ... more items
  ],
  "meta": {
    "total": 23,
    "kabupaten": "BEKASI",
    "provinsi": "JAWA BARAT"
  }
}
```

### 3. GET `/geojson/kabupaten-bekasi/kecamatan/:kecamatan`
**Deskripsi**: Mendapatkan data GeoJSON kecamatan tertentu

**Parameter**:
- `kecamatan` (string): Nama kecamatan (case insensitive)

**Example**: `/geojson/kabupaten-bekasi/kecamatan/CIKARANG UTARA`

**Response Structure**:
```json
{
  "success": true,
  "message": "Data GeoJSON Kecamatan CIKARANG UTARA berhasil dimuat",
  "data": {
    "type": "FeatureCollection",
    "name": "Kecamatan_CIKARANG UTARA_Kabupaten_Bekasi",
    "crs": {
      "type": "name",
      "properties": {
        "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
      }
    },
    "features": [
      {
        "type": "Feature",
        "properties": {
          "KECAMATAN": "CIKARANG UTARA",
          "KABKOT": "BEKASI",
          "PROV": "JAWA BARAT",
          "NEGARA": "INDONESIA"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[longitude, latitude], ...]]
        }
      }
    ]
  },
  "meta": {
    "kecamatan": "CIKARANG UTARA",
    "kabupaten": "BEKASI",
    "provinsi": "JAWA BARAT"
  }
}
```

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "message": "Kecamatan NAMA_KECAMATAN tidak ditemukan di Kabupaten Bekasi"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Terjadi kesalahan saat memuat data GeoJSON",
  "error": "Error details"
}
```

---

## 🚀 PROMPT UNTUK COPILOT AGENT FRONTEND

Saya memiliki API backend yang menyediakan data GeoJSON untuk Kabupaten Bekasi dan kecamatan-kecamatannya. Buatkan aplikasi frontend React/Next.js dengan fitur-fitur berikut:

### Requirements:
1. **Interactive Map Component** menggunakan Leaflet atau MapboxGL
2. **Dropdown/Select** untuk memilih kecamatan tertentu
3. **Toggle Button** untuk menampilkan semua kecamatan atau kecamatan tertentu
4. **Info Panel** yang menampilkan informasi kecamatan yang dipilih
5. **Responsive Design** dengan Tailwind CSS

### API Endpoints yang tersedia:
- `GET http://localhost:3001/geojson/kabupaten-bekasi` - Semua kecamatan
- `GET http://localhost:3001/geojson/kabupaten-bekasi/kecamatan-list` - List nama kecamatan
- `GET http://localhost:3001/geojson/kabupaten-bekasi/kecamatan/:nama` - Kecamatan spesifik

### Struktur Response API:
```typescript
interface APIResponse {
  success: boolean;
  message: string;
  data: GeoJSONFeatureCollection | KecamatanListItem[];
  meta: {
    total_kecamatan?: number;
    kecamatan_list?: string[];
    kabupaten: string;
    kecamatan?: string;
    provinsi?: string;
  };
}

interface KecamatanListItem {
  id: number;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  name: string;
  crs: {
    type: "name";
    properties: {
      name: string;
    };
  };
  features: GeoJSONFeature[];
}

interface GeoJSONFeature {
  type: "Feature";
  properties: {
    KECAMATAN: string;
    KABKOT: string;
    PROV: string;
    NEGARA: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}
```

### Features yang diinginkan:
1. **Map dengan Polygon** - Tampilkan batas kecamatan sebagai polygon di peta
2. **Color Coding** - Berikan warna berbeda untuk setiap kecamatan
3. **Hover Effects** - Highlight kecamatan saat di-hover
4. **Click Handler** - Klik polygon untuk menampilkan info detail
5. **Loading States** - Loading spinner saat fetch data
6. **Error Handling** - Handle error API dengan baik
7. **Search/Filter** - Bisa cari kecamatan berdasarkan nama
8. **Zoom Controls** - Button untuk zoom in/out dan fit bounds
9. **Legend** - Tampilkan legend dengan daftar kecamatan dan warnanya

### Layout Structure:
```
┌─────────────────────────────────────────┐
│ Header: "Peta Kabupaten Bekasi"         │
├─────────────────┬───────────────────────┤
│ Controls Panel  │                       │
│ - Dropdown      │                       │
│ - Toggle Button │        MAP            │
│ - Search        │                       │
│ - Legend        │                       │
├─────────────────┴───────────────────────┤
│ Info Panel (Selected Kecamatan Details) │
└─────────────────────────────────────────┘
```

### Tech Stack:
- React/Next.js
- TypeScript
- Tailwind CSS
- React Leaflet atau MapboxGL
- Axios/Fetch untuk API calls
- React Query (optional) untuk state management

### Additional Notes:
- Gunakan koordinat center Kabupaten Bekasi: [-6.2373, 107.1686]
- Default zoom level: 10
- Berikan styling yang modern dan user-friendly
- Pastikan responsive untuk mobile dan desktop
- Tambahkan loading skeleton untuk better UX

Buatkan struktur project lengkap dengan semua component yang dibutuhkan!
