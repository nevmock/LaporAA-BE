# GitHub Copilot Instructions for Lapor AA Backend

## Project Overview
Backend Node.js/Express.js API server untuk sistem pelaporan WhatsApp Lapor AA dengan:
- **WhatsApp Bot Integration**: Conversational flow handling untuk complaint reporting
- **Real-time Communication**: Socket.IO untuk dashboard updates
- **AI-Powered Context**: OpenAI integration untuk message understanding
- **Role-based API**: JWT authentication dengan multiple user roles

## Architecture Patterns

### Layered Architecture
```
Controllers → Services → Repositories → Models
```
- **Controllers**: Handle HTTP requests, validation, response formatting
- **Services**: Business logic, WhatsApp flow management, AI context analysis
- **Repositories**: Data access layer, MongoDB operations abstraction
- **Models**: Mongoose schemas dengan validation rules

### WhatsApp Bot Flow Architecture
```javascript
// Main flow pattern in botFlowService.js
session.step = "WAITING_FOR_X" // State machine approach
const context = await combinedContext(input); // AI context analysis
const effectiveMode = await modeManager.getEffectiveMode(from); // Manual/Auto mode
```

### Socket.IO Event Architecture
- **VPS-Optimized Config**: Production-ready socket configuration
- **Event Optimizer**: Backend event batching and optimization
- **Connection Recovery**: Auto-reconnection with state persistence

## Key Conventions

### File Organization
```
services/
├── botFlowService.js        # Main conversation orchestrator
├── components/              # Individual flow handlers
│   ├── signupHandler.js
│   ├── createReportHandler.js
│   └── checkReportHandler.js
├── responseMessage/         # WhatsApp response templates
└── modeManager.js          # Bot mode management
```

### Error Handling Pattern
```javascript
// Consistent error response format
try {
  const result = await someOperation();
  res.json(result);
} catch (error) {
  console.error('Error description:', error);
  res.status(500).json({ 
    message: "User-friendly error", 
    error: process.env.NODE_ENV === 'development' ? error.message : undefined 
  });
}
```

### Repository Pattern
```javascript
// All repos follow consistent CRUD pattern
exports.create = async (data) => { /* implementation */ };
exports.findById = async (id) => { /* implementation */ };
exports.findByCondition = async (condition) => { /* implementation */ };
exports.update = async (id, data) => { /* implementation */ };
exports.delete = async (id) => { /* implementation */ };
```

## Critical Workflows

### Development Commands
```bash
npm run dev          # Development with nodemon
npm start           # Production start
npm test            # Jest testing (basic setup)
```

### WhatsApp Webhook Setup
1. **Verification**: GET `/webhook` for initial Meta verification
2. **Message Handling**: POST `/webhook` receives WhatsApp messages
3. **Rate Limiting**: Built-in middleware prevents spam

### Bot Flow Development
```javascript
// Adding new conversation steps:
// 1. Define step in session model
session.step = "NEW_STEP_NAME";

// 2. Add handler in botFlowService.js
if (step === "NEW_STEP_NAME") {
  return await newStepHandler(from, input, sendReply);
}

// 3. Create dedicated handler in services/components/
```

### AI Context Integration
- **OpenAI Helper**: Classifies user intent (greeting, new_report, check_report, etc.)
- **Temperature 0.7**: Balanced creativity vs consistency
- **Fallback Handling**: Graceful degradation on API failures
- **Rate Limit Aware**: 429 error handling built-in

## Data Models

### Core Entities
```javascript
// Report Schema
{
  sessionId: String,        // Unique identifier
  from: String,            // WhatsApp number
  user: ObjectId,          // UserProfile reference
  location: {              // Location data
    type: "map|text",
    latitude: Number,
    longitude: Number,
    description: String,
    desa: String,
    kecamatan: String
  },
  complaint: String,       // Main complaint text
  photos: [String],        // File paths array
  tags: [String],         // Hashtags array
  is_pinned: Boolean      // Admin pin status
}

// UserSession Schema (Bot State)
{
  from: String,           // WhatsApp number
  step: String,          // Current conversation step
  currentAction: String, // Active flow
  tempData: Mixed,       // Temporary form data
  pendingFeedbackFor: [ObjectId] // Awaiting rating
}
```

### Authentication & Roles
```javascript
// JWT Payload Structure
{
  userId: ObjectId,
  phone: String,
  role: "SuperAdmin|Admin|Bupati",
  iat: Number,
  exp: Number
}

// Role hierarchy: SuperAdmin > Bupati > Admin
```

## Integration Points

### WhatsApp Business API
- **Webhook Verification**: Meta-required token verification
- **Message Types**: Text, location, media handling
- **Media Upload**: Multer + Sharp for image processing
- **Rate Limiting**: Express-rate-limit middleware

### AI Services
- **OpenAI GPT-3.5**: Context classification and intent recognition
- **Google Gemini**: Alternative AI provider (configured)
- **Fallback Strategy**: Default to "menu" context on AI failure

### External APIs
- **GeoJSON**: Location reverse geocoding
- **SP4N Lapor**: Government tracking system integration
- **Socket.IO Rooms**: Real-time dashboard updates

## Environment Configuration

### Required Variables
```bash
# Database
MONGO_URI=mongodb://localhost:27017/lapor-aa

# Authentication
JWT_SECRET=your-secret-key

# WhatsApp
WHATSAPP_TOKEN=your-meta-token
WHATSAPP_VERIFY_TOKEN=verification-token

# AI Services
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-gemini-key

# Socket.IO
NODE_ENV=production|development

# Cron Jobs
CRON_AUTO_CLOSE_FEEDBACK=0 0 * * *
CRON_CLEANUP_LOGS=0 2 * * 0
```

### Socket.IO VPS Configuration
- **Production**: Polling-first transport for VPS stability
- **Development**: WebSocket-first for local development
- **Fallback Config**: Automatic degradation on config errors

## Performance Patterns

### MongoDB Optimization
```javascript
// Connection pooling configuration
{
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false
}
```

### Memory Management
- **Session Cleanup**: Cron jobs for expired sessions
- **Log Rotation**: Automated log file management
- **Image Optimization**: Sharp for media compression

### Event Optimization
- **Backend Event Optimizer**: Batches socket events
- **Connection Recovery**: State persistence across reconnections
- **Health Checks**: Background socket monitoring

## Security Implementations

### Input Validation
- **Message Sanitization**: Clean WhatsApp input
- **File Upload Security**: Type and size validation
- **SQL Injection Prevention**: Mongoose built-in protection

### Rate Limiting
```javascript
// WhatsApp webhook protection
const limitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});
```

### Authentication Middleware
```javascript
// JWT verification pattern
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
};
```

## Testing & Debugging

### Bot Flow Testing
- **Manual Mode**: Disable AI for controlled testing
- **Session Reset**: `menu` command resets conversation state
- **Webhook Testing**: Use `test-*.http` files for API testing

### Socket.IO Debug
```javascript
// Enable socket debugging
DEBUG=socket.io* node app.js
```

### Performance Testing
- **K6 Integration**: Load testing configuration available
- **Response Time Monitoring**: Built-in performance tracking

When working with this backend:
1. Always check `effectiveMode` before processing bot messages
2. Use repository pattern for all database operations
3. Handle AI service failures gracefully with fallbacks
4. Follow session state machine pattern for bot flows
5. Test webhook endpoints with proper Meta verification
6. Monitor socket connection health in production environments
