# WhatsApp Media Support & Chat API Documentation

## Backend API untuk WhatsApp Media Support

Backend ini mendukung semua tipe media yang didukung oleh WhatsApp Business API dengan fitur Socket.IO untuk real-time messaging.

### Supported WhatsApp Media Types

#### 1. **Text Messages** 📝
- Format: Plain text
- Handling: Langsung disimpan sebagai string

#### 2. **Image** 🖼️
- Format: JPEG, PNG, WebP
- Max size: 5MB
- Handling: 
  - Download dari Meta API
  - Kompres menggunakan Sharp (max width 1280px, quality 70%)
  - Simpan di: `/public/uploads/`

#### 3. **Video** 🎥
- Format: MP4, 3GPP
- Max size: 16MB
- Handling:
  - Download dari Meta API
  - Simpan di: `/public/uploads/videos/`

#### 4. **Audio** 🎵
- Format: AAC, M4A, AMR, OGG
- Max size: 16MB
- Handling:
  - Download dari Meta API
  - Simpan di: `/public/uploads/audio/`

#### 5. **Voice Messages** 🎤
- Format: OGG Opus
- Max size: 16MB
- Handling:
  - Download dari Meta API
  - Simpan di: `/public/uploads/audio/`

#### 6. **Documents** 📄
- Format: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
- Max size: 100MB
- Handling:
  - Download dari Meta API
  - Simpan di: `/public/uploads/documents/`

#### 7. **Stickers** 🎭
- Format: WebP
- Max size: 500KB
- Handling:
  - Download dari Meta API
  - Simpan di: `/public/uploads/`

#### 8. **Location** 📍
- Format: Latitude, Longitude, Name/Address
- Handling: Disimpan sebagai JSON object

## Backend API Endpoints

### 1. **Send Message API**
```
POST /chat/send/:phoneNumber
```

**Request Body:**
```json
{
  "message": "Hello world",
  "nama_admin": "John Doe",
  "role": "Admin"
}
```

**Response:**
```json
{
  "success": true,
  "mode": "manual"
}
```

### 2. **Get Messages API**
```
GET /chat/:phoneNumber?limit=20&skip=0
```

**Response:**
```json
[
  {
    "from": "628123456789",
    "senderName": "John Doe",
    "message": "Hello",
    "type": "text",
    "mediaUrl": null,
    "timestamp": "2025-07-03T10:30:00Z"
  }
]
```

### 3. **Get Chat List API**
```
GET /chat/
```

**Response:**
```json
[
  {
    "_id": "628123456789",
    "senderName": "John Doe",
    "lastMessage": "Hello world",
    "lastTimestamp": "2025-07-03T10:30:00Z"
  }
]
```

### 4. **Get Chat Mode API**
```
GET /chat/mode/:phoneNumber
```

**Response:**
```json
{
  "mode": "manual",
  "isForceMode": false,
  "sessionMode": "manual"
}
```

## Socket.IO Events

### 1. **Connection Events**
```javascript
// Client connects
socket.on('connect', () => {
  console.log('Connected to server');
});

// Client disconnects
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### 2. **Send Message via Socket**
```javascript
// Send message
socket.emit('sendMessage', {
  to: '628123456789',
  message: 'Hello world',
  nama_admin: 'John Doe',
  role: 'Admin'
});

// Listen for response
socket.on('messageStatus', (result) => {
  console.log('Message sent:', result.success);
  console.log('Mode:', result.mode);
});
```

### 3. **Receive New Messages**
```javascript
// Listen for incoming messages
socket.on('newMessage', (message) => {
  console.log('New message:', message);
  /*
  {
    from: '628123456789',
    senderName: 'John Doe',
    message: 'Hello',
    type: 'text',
    mediaUrl: null,
    timestamp: '2025-07-03T10:30:00Z'
  }
  */
});
```

## Database Schema

### Message Model
```javascript
{
  from: String,         // WhatsApp phone number
  senderName: String,   // Contact name
  message: String,      // Text content or media description
  type: String,         // "text", "image", "video", "audio", "voice", "document", "sticker", "location"
  mediaUrl: String,     // Local file path for media files
  timestamp: Date       // Message timestamp
}
```

### File Structure
```
public/
├── uploads/           # Images & Stickers
├── uploads/videos/    # Video files
├── uploads/audio/     # Audio & Voice messages
└── uploads/documents/ # PDF, DOC, etc.
```

## API Response Format Examples

### Text Message
```json
{
  "from": "628123456789",
  "senderName": "John Doe",
  "message": "Hello world",
  "type": "text",
  "mediaUrl": null,
  "timestamp": "2025-07-03T10:30:00Z"
}
```

### Image Message
```json
{
  "from": "628123456789",
  "senderName": "John Doe",
  "message": "[Image] Photo caption",
  "type": "image",
  "mediaUrl": "/uploads/image_123.jpg",
  "timestamp": "2025-07-03T10:30:00Z"
}
```

### Video Message
```json
{
  "from": "628123456789",
  "senderName": "John Doe",
  "message": "[Video] Video caption",
  "type": "video",
  "mediaUrl": "/uploads/videos/video_123.mp4",
  "timestamp": "2025-07-03T10:30:00Z"
}
```

### Document Message
```json
{
  "from": "628123456789",
  "senderName": "John Doe",
  "message": "[Document] report.pdf - Document caption",
  "type": "document",
  "mediaUrl": "/uploads/documents/doc_123.pdf",
  "timestamp": "2025-07-03T10:30:00Z"
}
```

### Location Message
```json
{
  "from": "628123456789",
  "senderName": "John Doe",
  "message": "[Location] Jakarta, Indonesia",
  "type": "location",
  "mediaUrl": null,
  "timestamp": "2025-07-03T10:30:00Z"
}
```

## Error Handling

- **Media Download Errors**: Jika download media gagal, file tidak akan disimpan
- **Unsupported Media**: Tipe media tidak didukung akan menampilkan "Pesan dengan format tidak didukung"
- **API Errors**: Semua error akan dicatat di console dengan prefix "❌"
- **Socket Errors**: Error pada socket akan dikirim via event `messageStatus`

## Usage Examples

### Using REST API
```bash
# Send text message
curl -X POST http://localhost:3000/chat/send/628123456789 \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello world", "nama_admin": "Admin", "role": "Admin"}'

# Get messages
curl http://localhost:3000/chat/628123456789?limit=20

# Get chat list
curl http://localhost:3000/chat/

# Get chat mode
curl http://localhost:3000/chat/mode/628123456789
```

### Using Socket.IO (JavaScript)
```javascript
const socket = io('http://localhost:3000');

// Send message
socket.emit('sendMessage', {
  to: '628123456789',
  message: 'Hello world',
  nama_admin: 'Admin',
  role: 'Admin'
});

// Listen for responses
socket.on('messageStatus', (result) => {
  if (result.success) {
    console.log('Message sent successfully');
  } else {
    console.error('Failed to send message:', result.error);
  }
});

// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message received:', message);
});
```

## Notes

- Semua media file dapat diakses melalui URL `/uploads/...`
- Gambar otomatis dikompres untuk menghemat storage
- File non-gambar disimpan dalam format asli
- Setiap file memiliki nama unik untuk menghindari konflik
- Socket.IO mendukung real-time messaging untuk frontend yang membutuhkan
- API mendukung admin labeling dengan nama dan role
