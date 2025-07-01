# 🔧 Frontend Implementation Examples

## 1. API Service Functions (JavaScript/TypeScript)

```javascript
// services/geojsonApi.js
const API_BASE_URL = 'http://localhost:3001';

export const geojsonApi = {
  // Mendapatkan semua kecamatan di Kabupaten Bekasi
  getAllKecamatan: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/geojson/kabupaten-bekasi`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching all kecamatan:', error);
      throw error;
    }
  },

  // Mendapatkan daftar nama kecamatan
  getKecamatanList: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/geojson/kabupaten-bekasi/kecamatan-list`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching kecamatan list:', error);
      throw error;
    }
  },

  // Mendapatkan kecamatan tertentu
  getKecamatanByName: async (kecamatanName) => {
    try {
      const encodedName = encodeURIComponent(kecamatanName);
      const response = await fetch(`${API_BASE_URL}/geojson/kabupaten-bekasi/kecamatan/${encodedName}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching kecamatan ${kecamatanName}:`, error);
      throw error;
    }
  }
};
```

## 2. React Hooks for Data Fetching

```javascript
// hooks/useGeoJSON.js
import { useState, useEffect } from 'react';
import { geojsonApi } from '../services/geojsonApi';

export const useAllKecamatan = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await geojsonApi.getAllKecamatan();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export const useKecamatanList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await geojsonApi.getKecamatanList();
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export const useKecamatanByName = (kecamatanName) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!kecamatanName) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await geojsonApi.getKecamatanByName(kecamatanName);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [kecamatanName]);

  return { data, loading, error };
};
```

## 3. React Component Example Structure

```jsx
// components/BekasiMap.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useAllKecamatan, useKecamatanList } from '../hooks/useGeoJSON';

const BekasiMap = () => {
  const [selectedKecamatan, setSelectedKecamatan] = useState(null);
  const [showAll, setShowAll] = useState(true);
  
  const { data: allKecamatanData, loading: allLoading, error: allError } = useAllKecamatan();
  const { data: kecamatanList, loading: listLoading } = useKecamatanList();

  // Style untuk setiap polygon
  const getPolygonStyle = (feature) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    const index = kecamatanList.findIndex(
      item => item.kecamatan === feature.properties.KECAMATAN
    );
    
    return {
      fillColor: colors[index % colors.length] || '#3388ff',
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  // Handler untuk event polygon
  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.9
        });
      },
      mouseout: (e) => {
        const layer = e.target;
        layer.setStyle(getPolygonStyle(feature));
      },
      click: (e) => {
        setSelectedKecamatan(feature.properties);
      }
    });

    // Popup untuk setiap kecamatan
    layer.bindPopup(`
      <div class="p-3">
        <h3 class="font-bold text-lg">${feature.properties.KECAMATAN}</h3>
        <p class="text-gray-600">Kabupaten: ${feature.properties.KABKOT}</p>
        <p class="text-gray-600">Provinsi: ${feature.properties.PROV}</p>
      </div>
    `);
  };

  if (allLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (allError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading map data: {allError}
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg">
        <h3 className="font-bold mb-2">Kontrol Peta</h3>
        
        {/* Dropdown Kecamatan */}
        <select 
          className="w-full p-2 border rounded mb-2"
          onChange={(e) => setSelectedKecamatan(e.target.value)}
        >
          <option value="">Pilih Kecamatan</option>
          {kecamatanList.map((item) => (
            <option key={item.id} value={item.kecamatan}>
              {item.kecamatan}
            </option>
          ))}
        </select>

        {/* Toggle Show All */}
        <label className="flex items-center">
          <input 
            type="checkbox" 
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="mr-2"
          />
          Tampilkan Semua Kecamatan
        </label>
      </div>

      {/* Map */}
      <MapContainer 
        center={[-6.2373, 107.1686]} 
        zoom={10} 
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {allKecamatanData && (
          <GeoJSON 
            data={allKecamatanData.data}
            style={getPolygonStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Info Panel */}
      {selectedKecamatan && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-sm">
          <h3 className="font-bold text-lg mb-2">Info Kecamatan</h3>
          <div className="space-y-1">
            <p><span className="font-semibold">Nama:</span> {selectedKecamatan.KECAMATAN}</p>
            <p><span className="font-semibold">Kabupaten:</span> {selectedKecamatan.KABKOT}</p>
            <p><span className="font-semibold">Provinsi:</span> {selectedKecamatan.PROV}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BekasiMap;
```

## 4. Package Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8",
    "tailwindcss": "^3.4.0"
  }
}
```

## 5. CSS Import untuk Leaflet

```css
/* globals.css atau di component */
@import 'leaflet/dist/leaflet.css';

/* Fix untuk icon leaflet di Next.js */
.leaflet-default-icon-path {
  background-image: url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png');
}
```

## 6. Example Usage in Next.js Page

```jsx
// pages/peta-bekasi.js atau app/peta-bekasi/page.js
import dynamic from 'next/dynamic';

// Dynamic import untuk menghindari SSR issues dengan Leaflet
const BekasiMap = dynamic(() => import('../components/BekasiMap'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function PetaBekasiPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold text-center">
          Peta Kabupaten Bekasi & Kecamatan
        </h1>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-[600px] relative">
            <BekasiMap />
          </div>
        </div>
      </main>
    </div>
  );
}
```

Gunakan template dan contoh kode di atas untuk implementasi frontend! 🚀
