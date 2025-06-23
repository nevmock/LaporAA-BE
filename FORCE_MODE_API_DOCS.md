# Force Mode Manual API Documentation

## Overview
API untuk mengontrol mode manual secara paksa untuk user tertentu. Ini adalah "saklar utama" yang akan memaksa mode user menjadi manual atau mengembalikan ke sistem mode biasa.

## Konsep Mode Handling

### Mode Normal (forceModeManual: false)
- Mode ditentukan oleh sistem atau timeout
- User bisa berada di mode `bot` atau `manual` berdasarkan setting atau timeout `manualModeUntil`
- Jika `manualModeUntil` expired, otomatis kembali ke mode `bot`

### Force Mode Manual (forceModeManual: true)
- Mode dipaksa selalu `manual`
- Mengabaikan timeout `manualModeUntil`
- Bot tidak akan merespon apapun dari user ini
- Hanya admin yang bisa menangani user ini

## API Endpoints

### 1. Toggle Force Mode Manual
```http
PATCH /user/session/force-mode/:from
Content-Type: application/json

{
  "force": true | false
}
```

**Parameters:**
- `from`: Nomor WhatsApp user (contoh: 6281234567890)
- `force`: Boolean - true untuk aktivasi force mode, false untuk nonaktifkan

**Response:**
```json
{
  "message": "Force mode manual diaktifkan untuk 6281234567890",
  "session": {
    "from": "6281234567890",
    "forceModeManual": true,
    "mode": "manual",
    "effectiveMode": "manual",
    "manualModeUntil": null
  }
}
```

### 2. Cek Status Force Mode
```http
GET /user/session/force-mode/:from
```

**Response:**
```json
{
  "from": "6281234567890",
  "forceModeManual": true,
  "mode": "manual",
  "effectiveMode": "manual",
  "manualModeUntil": null,
  "isManualModeExpired": null
}
```

## Use Cases

### 1. Aktivasi Force Mode (User Bermasalah)
Jika ada user yang sering spam atau perlu penanganan khusus:
```bash
curl -X PATCH http://localhost:3001/user/session/force-mode/6281234567890 \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```
Setelah ini, bot tidak akan merespon user tersebut sama sekali.

### 2. Nonaktifkan Force Mode
Ketika user sudah tidak bermasalah:
```bash
curl -X PATCH http://localhost:3001/user/session/force-mode/6281234567890 \
  -H "Content-Type: application/json" \
  -d '{"force": false}'
```
User kembali bisa berinteraksi dengan bot secara normal.

### 3. Monitoring Status
Cek status force mode user:
```bash
curl http://localhost:3001/user/session/force-mode/6281234567890
```

## Perbedaan dengan API Mode Biasa

### API Mode Biasa (/user/user-mode/:from)
- Hanya mengubah mode temporari
- Masih terikat dengan sistem timeout
- Bisa ter-override oleh sistem

### API Force Mode (/user/session/force-mode/:from)
- Override semua sistem mode lainnya
- Tidak terikat timeout
- Hanya bisa diubah manual oleh admin

## Error Handling

### 400 Bad Request
```json
{
  "error": "Parameter 'force' harus berupa boolean (true/false)"
}
```

### 404 Not Found
```json
{
  "error": "Session tidak ditemukan",
  "suggestion": "Session akan dibuat otomatis saat user mengirim pesan pertama"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to update force mode",
  "error": "Database connection error"
}
```

## Integration Notes

### Dalam botFlowService.js
```javascript
// Sebelum
if (session.mode === "manual") return null;

// Sesudah - menggunakan getEffectiveMode()
const effectiveMode = session.getEffectiveMode();
if (effectiveMode === "manual") return null;
```

### Dalam webhookController.js
```javascript
// Bot mengecek effective mode sebelum membalas
const effectiveMode = session.getEffectiveMode();
if (effectiveMode === "bot") {
    await sendMessageToWhatsApp(from, botReply);
} else {
    console.log(`✋ Bot tidak balas karena effective mode: ${effectiveMode}`);
}
```

## Testing
Gunakan file `test-force-mode.http` untuk testing API ini dengan berbagai skenario.
