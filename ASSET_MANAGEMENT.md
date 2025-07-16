# Asset Management System - Dokumentasi

## Overview
Sistem manajemen aset yang baru untuk LaporAA v2 menyediakan struktur folder yang terorganisir dan metadata lengkap untuk semua file uploads. Sistem ini mendukung berbagai jenis media (gambar, video, audio, dokumen) dengan thumbnail generation dan cleanup otomatis.

## Struktur Folder

### 📁 Folder Utama
```
backend-lapor-AA/public/
├── uploads/                    # Files untuk laporan (reports)
│   ├── images/                # Gambar laporan
│   ├── videos/                # Video laporan  
│   ├── audio/                 # Audio laporan
│   └── documents/             # Dokumen laporan
├── uploadsTindakan/           # Files untuk tindakan
│   ├── evidence/              # Evidence tindakan
│   ├── documents/             # Dokumen tindakan
│   └── photos/                # Foto tindakan
├── assets/                    # Asset statis
│   ├── tutorials/             # Gambar tutorial
│   ├── icons/                 # Icon aplikasi
│   └── templates/             # Template files
└── temp/                      # Temporary upload folder
```

### 🗂️ Organisasi File
- **Naming Convention**: `{timestamp}-{sanitized_name}.{ext}`
- **Auto-categorization**: Berdasarkan MIME type
- **Thumbnail Generation**: Otomatis untuk gambar (thumb, medium, large)
- **Metadata Tracking**: Semua info file tersimpan di database

## Database Schema Update

### Report Model - Photos Field
```javascript
photos: [{
    url: String,                // Path file utama
    type: String,              // 'image', 'video', 'audio'
    caption: String,           // Caption/deskripsi
    originalUrl: String,       // Path original (backup)
    fileSize: Number,          // Size dalam bytes
    mimeType: String,          // MIME type
    originalName: String,      // Nama file asli
    uploadedAt: Date,          // Waktu upload
    folder: String             // Folder penyimpanan
}]
```

## API Endpoints

### 📊 Asset Statistics
```
GET /test/asset-stats (public)
GET /assets/stats (authenticated)
```

Response:
```json
{
    "status": "success",
    "data": {
        "files": {
            "totalFiles": 173,
            "totalSize": 54293355,
            "byType": {
                "images": {"count": 131, "size": 21282330},
                "videos": {"count": 5, "size": 13242571},
                "audio": {"count": 2, "size": 20388},
                "documents": {"count": 1, "size": 1044271}
            }
        },
        "database": {
            "reports": 10,
            "tindakan": 15
        }
    }
}
```

### 📤 Upload Endpoints

#### Upload untuk Reports
```
POST /assets/upload/report
Content-Type: multipart/form-data
Field: files (array, max 10 files)
```

#### Upload untuk Tindakan
```
POST /assets/upload/tindakan  
Content-Type: multipart/form-data
Field: files (array, max 5 files)
```

#### Upload Spesifik Media Type
```
POST /assets/upload/image     (single image)
POST /assets/upload/video     (single video) 
POST /assets/upload/audio     (single audio)
POST /assets/upload/document  (single document)
```

### 🧹 Cleanup System
```
POST /assets/cleanup
```

Menghapus file orphaned (tidak terpakai) yang lebih dari 24 jam.

## File Size Limits

| Type | Size Limit | Extensions Allowed |
|------|------------|-------------------|
| Images | 10MB | jpg, jpeg, png, webp, gif |
| Videos | 100MB | mp4, avi, mov, wmv, flv |
| Audio | 50MB | mp3, wav, ogg, aac |
| Documents | 25MB | pdf, doc, docx |

## Integration dengan WhatsApp Bot

### Current Integration
Sistem asset manager terintegrasi dengan message controller untuk:
- ✅ Upload gambar dari admin
- ✅ Upload video dari admin  
- ✅ Upload audio dari admin
- ✅ Upload dokumen dari admin
- ✅ Penyimpanan terorganisir
- ✅ Metadata lengkap

### URL Generation
```javascript
// OLD: `/uploads/${filename}`
// NEW: `/uploads/images/${timestamp}-${sanitized_name}.jpg`
```

## Thumbnail System

### Auto-generated Sizes
- **Thumb**: 150x150px (untuk preview)
- **Medium**: 400x300px (untuk display normal)  
- **Large**: 800x600px (untuk detail view)

### Naming Convention
```
original: 1752663456789-laporan_jalan_rusak.jpg
thumb:    1752663456789-laporan_jalan_rusak_thumb.jpg
medium:   1752663456789-laporan_jalan_rusak_medium.jpg
large:    1752663456789-laporan_jalan_rusak_large.jpg
```

## Migration Status

### ✅ Completed Migrations
1. **Photos Structure**: String array → Object array dengan metadata
2. **Session Reset**: Clean up stuck sessions
3. **Status Fields**: Default values untuk report status
4. **Database Indexes**: Performance optimization

### 🔄 Auto-Migration
Sistem migration berjalan otomatis setiap server restart dan hanya mengeksekusi migration yang belum pernah dijalankan.

## Monitoring & Maintenance

### File Statistics
```bash
curl http://localhost:3001/test/asset-stats
```

### Manual Cleanup
```bash
curl -X POST http://localhost:3001/assets/cleanup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Log Monitoring
- Asset operations logged dengan emoji indicators
- Error tracking untuk upload failures
- Performance metrics untuk file processing

## Performance Optimizations

### 🚀 Implemented
- ✅ Thumbnail generation untuk fast loading
- ✅ File categorization untuk efficient storage
- ✅ Orphaned file cleanup
- ✅ Database indexes untuk faster queries
- ✅ MIME type validation
- ✅ File size limits

### 📈 Benefits
- **Storage**: Organized structure, easy backup/restore
- **Performance**: Faster file access, thumbnails
- **Maintenance**: Auto-cleanup, monitoring
- **Security**: File type validation, size limits
- **Scalability**: Support untuk multiple file types

## Usage Examples

### Frontend Integration
```javascript
// Upload files untuk report
const formData = new FormData();
formData.append('files', imageFile);
formData.append('files', videoFile);

const response = await fetch('/assets/upload/report', {
    method: 'POST',
    body: formData,
    headers: {
        'Authorization': `Bearer ${token}`
    }
});

const result = await response.json();
// result.files contains metadata for each uploaded file
```

### WhatsApp Bot Integration
```javascript
// Send image with new system
const imageMetadata = {
    url: "/uploads/images/1752663456789-laporan.jpg",
    type: "image", 
    caption: "Foto laporan jalan rusak",
    originalUrl: "/uploads/images/1752663456789-laporan.jpg"
};

await sendMessageToWhatsApp(phoneNumber, {
    type: "image",
    link: `${process.env.BASE_URL}${imageMetadata.url}`,
    caption: imageMetadata.caption
});
```

## Next Steps

### 🎯 Potential Enhancements
1. **CDN Integration**: untuk file serving yang lebih cepat
2. **Image Compression**: otomatis compress gambar
3. **Backup System**: scheduled backup ke cloud storage
4. **Analytics**: detailed usage analytics
5. **Admin Dashboard**: visual file management interface

---

**Status**: ✅ **ACTIVE & READY FOR PRODUCTION**

Sistem asset management baru sudah terintegrasi penuh dengan:
- Database migration system ✅
- WhatsApp bot integration ✅ 
- Real-time notification system ✅
- Auto-cleanup & monitoring ✅
