# Mode Management System - Dokumentasi Lengkap

## 📋 Overview
Sistem pengelolaan mode terpusat dengan 3 jenis mode:

### 1. **Bot Mode** 🤖
- Mode default
- Bot otomatis merespon semua pesan user
- Tidak ada timeout

### 2. **Manual Mode** 👤
- Admin yang merespon, bot tidak aktif
- **ADA TIMEOUT** - akan otomatis kembali ke bot mode
- Timeout bisa diatur dari 0.1 menit sampai 24 jam (1440 menit)

### 3. **Force Manual Mode** 🔒
- Saklar utama yang override semua mode lain
- **TIDAK ADA TIMEOUT** - permanen sampai admin matikan
- Mode selalu manual selama aktif

## ⏰ Timeout Behavior

| Mode Type | Timeout | Behavior |
|-----------|---------|----------|
| Bot Mode | ❌ Tidak ada | Permanent sampai diubah |
| Manual Mode | ✅ Ada | Auto-expire ke bot mode |
| Force Manual Mode | ❌ Tidak ada | Permanent sampai dimatikan admin |

## 🔄 Mode Priority System

```
1. Force Manual Mode (TERTINGGI)
   ↓ (jika tidak aktif)
2. Manual Mode + Timeout Check  
   ↓ (jika expired/tidak ada)
3. Bot Mode (DEFAULT)
```

## 🛠 API Endpoints

### Base URL: `/mode`

#### 🔒 Force Mode (Saklar Utama)
```http
# Aktivasi Force Mode (TANPA TIMEOUT)
POST /mode/force/:from
{
  "force": true
}

# Nonaktifkan Force Mode
POST /mode/force/:from
{
  "force": false
}
```

#### ⏰ Manual Mode dengan Timeout
```http
# Set manual mode dengan timeout
POST /mode/manual/:from
{
  "minutes": 5  // 0.1 - 1440 menit
}
```

#### 🎛 Mode Biasa
```http
# Set mode biasa (tanpa timeout)
PUT /mode/:from
{
  "mode": "bot" | "manual"
}

# Reset ke bot mode
DELETE /mode/:from
```

#### 📊 Monitoring
```http
# Info mode user
GET /mode/:from

# Check manual mode
GET /mode/:from/is-manual

# List users dalam manual mode
GET /mode/manual/list

# Cleanup expired sessions
POST /mode/cleanup
```

## 🎯 Use Cases

### 1. **User Bermasalah/Spam**
```bash
# Aktivasi force mode (PERMANENT)
curl -X POST http://localhost:3001/mode/force/6281234567890 \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```
→ Bot berhenti merespon SELAMANYA sampai admin matikan

### 2. **Penanganan Sementara**
```bash
# Manual mode dengan timeout 30 menit
curl -X POST http://localhost:3001/mode/manual/6281234567890 \
  -H "Content-Type: application/json" \
  -d '{"minutes": 30}'
```
→ Bot berhenti 30 menit, lalu otomatis aktif lagi

### 3. **Maintenance/Debug**
```bash
# Set manual mode tanpa timeout
curl -X PUT http://localhost:3001/mode/6281234567890 \
  -H "Content-Type: application/json" \
  -d '{"mode": "manual"}'
```
→ Manual sampai admin set kembali ke bot

## 🔍 Response Examples

### Mode Info Response
```json
{
  "from": "6281234567890",
  "mode": "manual",
  "effectiveMode": "manual",
  "forceModeManual": false,
  "manualModeUntil": "2025-06-23T10:30:00.000Z",
  "isManualModeExpired": false,
  "timeLeft": "25 menit"
}
```

### Force Mode Protection
```json
{
  "success": false,
  "message": "Force mode aktif, tidak bisa set manual mode dengan timeout",
  "effectiveMode": "manual",
  "forceModeManual": true
}
```

## ⚡ Auto-Cleanup Features

### 1. **Real-time Expiry Check**
- Setiap kali `getEffectiveMode()` dipanggil
- Otomatis update mode jika timeout habis

### 2. **Batch Cleanup**
```bash
curl -X POST http://localhost:3001/mode/cleanup
```
- Cleanup semua session expired sekaligus
- Bisa dijadwalkan dengan cron job

## 🎛 Mode Manager Class

Semua logic terpusat di `services/modeManager.js`:

```javascript
const modeManager = require('./services/modeManager');

// Check effective mode
const mode = await modeManager.getEffectiveMode(from);

// Set force mode
await modeManager.setForceMode(from, true);

// Set manual dengan timeout
await modeManager.setManualModeWithTimeout(from, 5);

// Check if in manual mode
const isManual = await modeManager.isInManualMode(from);
```

## 🔧 Integration

### Bot Flow Service
```javascript
const effectiveMode = await modeManager.getEffectiveMode(from);
if (effectiveMode === "manual") return null;
```

### Webhook Controller
```javascript
const effectiveMode = await modeManager.getEffectiveMode(from);
if (effectiveMode === "bot") {
    await sendMessageToWhatsApp(from, botReply);
}
```

## 📈 Monitoring Dashboard

API untuk monitoring:
- `/mode/manual/list` - List semua user dalam manual mode
- `/mode/:from` - Detail mode user
- `/mode/cleanup` - Cleanup expired sessions

## 🚨 Important Notes

1. **Force Mode Override**: Force mode selalu menang atas mode lain
2. **Timeout Protection**: Tidak bisa set timeout jika force mode aktif
3. **Auto-Cleanup**: System otomatis cleanup expired sessions
4. **Real-time**: Mode check dilakukan real-time dengan auto-expire

## 🧪 Testing

Gunakan file `test-mode-management.http` untuk testing lengkap semua skenario.
