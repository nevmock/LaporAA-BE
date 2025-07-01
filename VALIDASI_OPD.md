# Validasi dan Pembersihan Field OPD

## Ringkasan Perubahan

Telah ditambahkan sistem validasi dan pembersihan untuk field `opd` dalam model `Tindakan` untuk mencegah string kosong dan spasi masuk ke array.

## File yang Diubah

### 1. Model Tindakan (`models/Tindakan.js`)
- **Tambahan custom validator** untuk field `opd`
- **Pre-save middleware** untuk double protection pembersihan data

```javascript
opd: {
    type: [String],
    default: [],
    validate: {
        validator: function(arr) {
            return arr.every(item => 
                typeof item === 'string' && 
                item.trim().length > 0
            );
        },
        message: 'OPD tidak boleh berisi string kosong atau hanya spasi'
    }
}
```

### 2. Utility Function (`utils/opdValidator.js`)
**File baru** dengan fungsi-fungsi:
- `cleanOpdArray(opd)` - Membersihkan array OPD
- `isValidOpdArray(opdArray)` - Validasi array OPD  
- `validateAndCleanOpd(opd)` - Validasi dan bersihkan sekaligus

### 3. Repository (`repositories/tindakanRepo.js`)
- Menggunakan `cleanOpdArray()` untuk membersihkan input OPD
- Menghapus string kosong dan spasi sebelum menyimpan

### 4. Middleware (`middlewares/opdValidationMiddleware.js`)
**File baru** dengan middleware `validateOpdMiddleware` untuk validasi input di route level.

### 5. Routes (`routes/tindakanRoutes.js`)
- Menambahkan middleware validasi pada route update tindakan
- Route: `PUT /:reportId` sekarang menggunakan `validateOpdMiddleware`

### 6. API Konversi (`routes/fixApi.js`)
- **Update API** `POST /fix/convert-opd-to-array` untuk membersihkan data existing
- **Tambahan API** `POST /fix/test-opd-validation` untuk testing validasi
- Menggunakan utility function untuk konsistensi

## Aturan Pembersihan

1. **String kosong** (`""`) dihapus dari array
2. **String hanya spasi** (`"   "`) dihapus dari array
3. **null/undefined** dikonversi menjadi array kosong `[]`
4. **String tunggal** dikonversi menjadi array dengan 1 elemen
5. **Semua elemen** di-trim (hapus spasi di awal/akhir)

## API Endpoints

### Konversi Data Existing
```http
POST /fix/convert-opd-to-array
```
Membersihkan semua data OPD yang sudah ada di database.

### Test Validasi
```http
POST /fix/test-opd-validation
Content-Type: application/json

{
    "opd": ["OPD 1", "  ", "", "OPD 2", "   OPD 3   "]
}
```

**Response:**
```json
{
    "message": "Test validasi OPD",
    "input": ["OPD 1", "  ", "", "OPD 2", "   OPD 3   "],
    "result": {
        "isValid": true,
        "cleanedOpd": ["OPD 1", "OPD 2", "OPD 3"],
        "errors": []
    },
    "inputType": "array"
}
```

## Cara Penggunaan

### 1. Jalankan Konversi untuk Data Existing
```bash
curl -X POST http://localhost:3000/fix/convert-opd-to-array
```

### 2. Data Baru Otomatis Ter-validasi
Semua input OPD baru otomatis dibersihkan melalui:
- Middleware pada route level
- Repository validation  
- Model pre-save middleware
- Model custom validator

### 3. Testing Validasi
Gunakan endpoint test untuk memverifikasi pembersihan data:
```bash
curl -X POST http://localhost:3000/fix/test-opd-validation \
  -H "Content-Type: application/json" \
  -d '{"opd": ["Test", "  ", "Valid OPD"]}'
```

## Manfaat

✅ **Konsistensi Data** - Semua OPD dijamin berupa array of string valid  
✅ **No Empty Strings** - Tidak ada string kosong atau spasi di array  
✅ **Backward Compatible** - Data lama tetap bisa diakses  
✅ **Multi-layer Protection** - Validasi di berbagai level  
✅ **Easy Migration** - API konversi untuk data existing

## Catatan

- Perubahan ini **tidak merusak** data existing
- API konversi bersifat **idempotent** (aman dijalankan berulang)
- Validasi bekerja di **multiple layer** untuk protection maksimal
- **Semua input OPD** otomatis dibersihkan tanpa manual intervention
