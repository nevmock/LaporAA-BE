# Backend API Documentation

## WhatsApp Chat Backend API

Backend API ini menyediakan endpoint untuk mengelola chat WhatsApp dengan dukungan semua tipe media dan real-time messaging via Socket.IO.

## 🔧 Features

- ✅ **Full Media Support** - Text, Image, Video, Audio, Voice, Document, Sticker, Location
- ✅ **Real-time Messaging** - Socket.IO untuk update langsung
- ✅ **Admin Management** - Role-based messaging dengan labeling
- ✅ **Mode Detection** - Bot/Manual/Force mode
- ✅ **File Management** - Auto-compress images, organized file structure
- ✅ **RESTful API** - Complete CRUD operations untuk chat

## 📡 Socket.IO Events

### Server Events (Emit dari Backend)
```javascript
// New incoming message
socket.emit('newMessage', {
  from: '628123456789',
  senderName: 'John Doe',
  message: 'Hello',
  type: 'text',
  mediaUrl: null,
  timestamp: '2025-07-03T10:30:00Z'
});

// Message status response
socket.emit('messageStatus', {
  success: true,
  mode: 'manual',
  error: null
});
```

### Client Events (Listen dari Frontend)
```javascript
// Send message to WhatsApp
socket.on('sendMessage', (data) => {
  // data: { to, message, nama_admin, role }
});
```

## 🛠 REST API Endpoints

### 1. Send Message
```
POST /chat/send/:phoneNumber
Content-Type: application/json

{
  "message": "Hello world",
  "nama_admin": "John Doe",
  "role": "Admin"
}
```

### 2. Get Messages
```
GET /chat/:phoneNumber?limit=20&skip=0
```

### 3. Get Chat List
```
GET /chat/
```

### 4. Get Chat Mode
```
GET /chat/mode/:phoneNumber
```

## 🔌 Integration Examples

### Frontend Integration (JavaScript)
```javascript
// Socket.IO Connection
const socket = io('http://localhost:3000');

// Send message
function sendMessage(phoneNumber, message, adminName, role) {
  socket.emit('sendMessage', {
    to: phoneNumber,
    message: message,
    nama_admin: adminName,
    role: role
  });
}

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
  // Update your UI here
});
```

### React.js Integration
```jsx
import io from 'socket.io-client';
import { useState, useEffect } from 'react';

function ChatApp() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);
    
    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    return () => newSocket.close();
  }, []);
  
  const sendMessage = (phoneNumber, message) => {
    if (socket) {
      socket.emit('sendMessage', {
        to: phoneNumber,
        message: message,
        nama_admin: 'Admin',
        role: 'Admin'
      });
    }
  };
  
  return (
    <div>
      {/* Your chat UI here */}
    </div>
  );
}
```

### Flutter Integration
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  late IO.Socket socket;
  
  void connectToServer() {
    socket = IO.io('http://localhost:3000', <String, dynamic>{
      'transports': ['websocket'],
    });
    
    socket.on('connect', (_) {
      print('Connected to server');
    });
    
    socket.on('newMessage', (data) {
      print('New message: $data');
      // Handle new message
    });
    
    socket.on('messageStatus', (data) {
      print('Message status: $data');
      // Handle message status
    });
  }
  
  void sendMessage(String phoneNumber, String message, String adminName, String role) {
    socket.emit('sendMessage', {
      'to': phoneNumber,
      'message': message,
      'nama_admin': adminName,
      'role': role
    });
  }
}
```

### PHP Integration (REST API)
```php
<?php
class WhatsAppChatAPI {
    private $baseUrl;
    
    public function __construct($baseUrl) {
        $this->baseUrl = $baseUrl;
    }
    
    public function sendMessage($phoneNumber, $message, $adminName, $role) {
        $data = [
            'message' => $message,
            'nama_admin' => $adminName,
            'role' => $role
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . "/chat/send/" . $phoneNumber);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    public function getMessages($phoneNumber, $limit = 20, $skip = 0) {
        $url = $this->baseUrl . "/chat/" . $phoneNumber . "?limit=" . $limit . "&skip=" . $skip;
        $response = file_get_contents($url);
        return json_decode($response, true);
    }
    
    public function getChatList() {
        $url = $this->baseUrl . "/chat/";
        $response = file_get_contents($url);
        return json_decode($response, true);
    }
}

// Usage
$chatAPI = new WhatsAppChatAPI('http://localhost:3000');
$result = $chatAPI->sendMessage('628123456789', 'Hello world', 'Admin', 'Admin');
?>
```

## 🗂 File Structure

```
public/
├── uploads/           # Gambar & Stiker
├── uploads/videos/    # File video
├── uploads/audio/     # Audio & Voice messages
└── uploads/documents/ # PDF, DOC, etc.
```

## 📊 Response Examples

### Success Response
```json
{
  "success": true,
  "mode": "manual"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Gagal mengirim pesan"
}
```

### Message Object
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

## 🚀 Getting Started

1. **Install Dependencies**
```bash
npm install
```

2. **Set Environment Variables**
```bash
WHATSAPP_ACCESS_TOKEN=your_token_here
MONGODB_URI=mongodb://localhost:27017/lapor-aa
```

3. **Start Server**
```bash
npm start
```

4. **Test API**
```bash
curl -X POST http://localhost:3000/chat/send/628123456789 \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello world", "nama_admin": "Admin", "role": "Admin"}'
```

## 📝 Notes

- Server berjalan di port 3000 (default)
- Semua file media dapat diakses via HTTP
- Socket.IO mendukung real-time updates
- API mendukung CORS untuk development
- Logging tersedia untuk debugging
