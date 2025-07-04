# Chat Dashboard Documentation

## Overview
Dashboard chat real-time yang terintegrasi dengan WhatsApp Business API untuk mengelola percakapan antara admin dan pengguna.

## Features

### 🔄 Real-time Communication
- **Socket.IO Integration**: Pesan masuk dan keluar secara real-time
- **Live Updates**: Chat list dan pesan terupdate otomatis
- **Instant Notifications**: Notifikasi pesan baru langsung

### 👥 Multi-Admin Support
- **Admin Roles**: Admin, Super Admin, Bupati
- **Admin Identification**: Nama admin tercantum dalam pesan
- **Role-based Labeling**: Label otomatis berdasarkan role

### 📱 Multi-Media Support
- **Text Messages**: Pesan teks biasa
- **Images**: Gambar dengan preview dan zoom
- **Videos**: Video dengan player controls
- **Audio**: File audio dan voice notes
- **Documents**: PDF, DOC, XLS dengan download link
- **Location**: Koordinat dan alamat lokasi
- **Stickers**: Stiker WhatsApp

### 🤖 Mode Management
- **Bot Mode**: Respon otomatis dari bot
- **Manual Mode**: Admin merespon manual
- **Force Mode**: Override mode sementara
- **Visual Indicators**: Indikator mode yang jelas

## Access Points

### Dashboard URLs
- **Chat Dashboard**: `http://localhost:3000/dashboard/chat`
- **Performance Dashboard**: `http://localhost:3000/dashboard/performance`

### API Endpoints
- **GET /chat/**: Daftar semua chat
- **GET /chat/:phone**: Riwayat pesan untuk nomor tertentu
- **POST /chat/send/:phone**: Kirim pesan ke nomor tertentu
- **GET /chat/mode/:phone**: Mode chat untuk nomor tertentu

## Socket.IO Events

### Client to Server
```javascript
// Send message
socket.emit('sendMessage', {
    to: '6281234567890',
    message: 'Hello world',
    nama_admin: 'John Doe',
    role: 'Admin'
});
```

### Server to Client
```javascript
// New message received
socket.on('newMessage', (message) => {
    console.log('New message:', message);
});

// Message status response
socket.on('messageStatus', (result) => {
    if (result.success) {
        console.log('Message sent successfully');
    } else {
        console.error('Failed to send message:', result.error);
    }
});
```

## User Interface

### Sidebar - Chat List
- **Search Box**: Cari chat berdasarkan nama atau nomor
- **Chat Items**: Daftar percakapan dengan preview pesan terakhir
- **Status Indicators**: Online/offline status (untuk future development)
- **Time Stamps**: Waktu pesan terakhir

### Main Chat Area
- **Chat Header**: Nama kontak, nomor telepon, dan mode indicator
- **Message Area**: Riwayat percakapan dengan scroll otomatis
- **Input Area**: Form untuk mengirim pesan dengan info admin

### Message Types Display
- **Text**: Pesan teks biasa dalam bubble
- **Image**: Thumbnail dengan click-to-zoom
- **Video**: Video player dengan controls
- **Audio**: Audio player dengan controls
- **Document**: Icon dengan nama file dan download link
- **Location**: Koordinat dan deskripsi lokasi
- **Sticker**: Stiker display

## Admin Information

### Fields
- **Admin Name**: Nama admin yang akan tercantum di pesan
- **Role**: Pilihan antara Admin, Super Admin, atau Bupati

### Message Labeling
Dalam mode manual, pesan akan otomatis ditambahkan label:
- `\n\n-Admin : [Nama Admin]` untuk role Admin
- `\n\n-Superadmin` untuk role Super Admin
- `\n\n-Bupati` untuk role Bupati

## Mode Indicators

### Visual Indicators
- **🟢 Bot Mode**: Hijau - Bot aktif merespon
- **🟡 Manual Mode**: Kuning - Admin merespon manual
- **🔴 Force Mode**: Merah - Override mode aktif

### Mode Behavior
- **Bot Mode**: Sistem bot otomatis merespon
- **Manual Mode**: Admin harus merespon manual
- **Force Mode**: Temporary override dari mode normal

## Real-time Features

### Auto-Updates
- **New Messages**: Pesan baru langsung muncul
- **Chat List**: Urutan chat berubah berdasarkan pesan terakhir
- **Delivery Status**: Status pengiriman pesan real-time

### Notifications
- **Sound Notifications**: Untuk future development
- **Browser Notifications**: Untuk future development
- **Visual Indicators**: Highlight chat dengan pesan baru

## Technical Implementation

### Backend Integration
```javascript
// Socket.IO connection in app.js
io.on("connection", (socket) => {
    // Handle send message from dashboard
    socket.on("sendMessage", async (data) => {
        // Process and send to WhatsApp
        // Emit response back to client
    });
});
```

### Frontend Integration
```javascript
// Initialize socket connection
const socket = io();

// Listen for new messages
socket.on('newMessage', (message) => {
    addMessageToChat(message);
    updateChatInList(message);
});
```

### Database Structure
```javascript
// Message Model
{
    from: String,         // Phone number
    senderName: String,   // Contact name
    message: String,      // Message content
    type: String,         // Message type
    mediaUrl: String,     // Media file URL
    timestamp: Date       // Message timestamp
}
```

## Security Features

### Authentication
- **Admin Authentication**: Untuk future development
- **Role-based Access**: Berbeda akses berdasarkan role
- **Session Management**: Untuk future development

### Data Protection
- **Input Validation**: Validasi input form
- **XSS Prevention**: Sanitasi konten pesan
- **CSRF Protection**: Untuk future development

## Browser Support

### Supported Browsers
- **Chrome**: 60+ ✅
- **Firefox**: 60+ ✅
- **Safari**: 12+ ✅
- **Edge**: 79+ ✅

### Mobile Responsiveness
- **Responsive Design**: Adaptif untuk mobile
- **Touch Support**: Optimized untuk touch interaction
- **Mobile Chat Layout**: Stack layout untuk mobile

## Performance Optimization

### Loading Strategy
- **Lazy Loading**: Load pesan sesuai kebutuhan
- **Pagination**: Limit pesan per request
- **Caching**: Cache chat list dan pesan

### Real-time Efficiency
- **Socket.IO Rooms**: Untuk future development
- **Message Queuing**: Untuk future development
- **Connection Pooling**: Untuk future development

## Future Enhancements

### Planned Features
- **File Upload**: Upload file dari dashboard
- **Message Search**: Pencarian dalam riwayat chat
- **Message Reactions**: Emoji reactions
- **Typing Indicators**: Indikator sedang mengetik
- **Read Receipts**: Status baca pesan
- **Message Templates**: Template pesan cepat
- **Bulk Messaging**: Broadcast ke multiple user
- **Chat Analytics**: Statistik percakapan
- **Dark Mode**: Tema gelap
- **Multi-language**: Dukungan multiple bahasa

### Technical Improvements
- **Authentication System**: Login admin
- **User Roles Management**: Granular permissions
- **Message Encryption**: End-to-end encryption
- **API Rate Limiting**: Pembatasan request
- **Logging System**: Audit trail lengkap
- **Backup System**: Backup otomatis data chat

## Troubleshooting

### Common Issues
1. **Socket connection failed**: Pastikan server running
2. **Messages not updating**: Refresh browser atau restart server
3. **Cannot send message**: Check WhatsApp API credentials
4. **Media not loading**: Verify file paths dan permissions

### Debug Mode
- **Console Logging**: Check browser console untuk error
- **Network Tab**: Monitor API calls
- **Socket.IO Debug**: Enable debug mode untuk troubleshooting

## API Integration

### WhatsApp Business API
- **Send Message**: Integration dengan Meta API
- **Media Download**: Download dan simpan media files
- **Webhook Handler**: Terima pesan masuk dari WhatsApp

### Database Integration
- **MongoDB**: Penyimpanan pesan dan session
- **Aggregation**: Query optimized untuk chat list
- **Indexing**: Index untuk performance query
