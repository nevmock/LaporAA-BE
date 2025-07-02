# Admin Performance Dashboard API

## Overview
API untuk tracking dan monitoring performa admin dalam memproses laporan. Mencakup statistik login/logout, aktivitas pemrosesan laporan, dan metrik performa lainnya.

## Endpoints

### 1. Dashboard Utama
**GET** `/performance/dashboard`

Query Parameters:
- `startDate` (optional): YYYY-MM-DD - tanggal mulai filter
- `endDate` (optional): YYYY-MM-DD - tanggal akhir filter  
- `adminId` (optional): ObjectId - filter untuk admin tertentu

Response:
```json
{
  "dateRange": {
    "start": "2025-06-01T00:00:00.000Z",
    "end": "2025-07-01T23:59:59.999Z"
  },
  "adminStats": [
    {
      "adminId": "60d5ec49eb2c6a1234567890",
      "adminName": "John Doe",
      "role": "Admin",
      "totalActivities": 156,
      "reportActivities": 45,
      "lastActivity": "2025-07-01T10:30:00.000Z"
    }
  ],
  "reportStats": [
    {
      "adminId": "60d5ec49eb2c6a1234567890",
      "adminName": "John Doe",
      "role": "Admin",
      "totalProcessed": 23,
      "statusBreakdown": [
        {"status": "Selesai Penanganan", "count": 15},
        {"status": "Proses OPD Terkait", "count": 8}
      ]
    }
  ],
  "activityStats": [
    {
      "date": "2025-07-01",
      "adminId": "60d5ec49eb2c6a1234567890",
      "adminName": "John Doe",
      "totalActivities": 25,
      "activities": [
        {"type": "login", "count": 1},
        {"type": "process_report", "count": 15},
        {"type": "update_report", "count": 9}
      ]
    }
  ],
  "onlineStats": [
    {
      "adminId": "60d5ec49eb2c6a1234567890",
      "adminName": "John Doe",
      "role": "Admin",
      "totalSessions": 8,
      "totalDuration": 480,
      "avgDuration": 60.5,
      "lastLogin": "2025-07-01T08:00:00.000Z",
      "isCurrentlyOnline": true
    }
  ]
}
```

### 2. Detail Admin Tertentu
**GET** `/performance/admin/:adminId`

Query Parameters:
- `startDate` (optional): YYYY-MM-DD
- `endDate` (optional): YYYY-MM-DD

Response:
```json
{
  "adminInfo": {
    "_id": "60d5ec49eb2c6a1234567890",
    "nama_admin": "John Doe",
    "username": "johndoe",
    "role": "Admin"
  },
  "activities": [
    {
      "_id": "60d5ec49eb2c6a1234567891",
      "activityType": "process_report",
      "description": "Admin assigned to process report",
      "createdAt": "2025-07-01T10:30:00.000Z",
      "relatedReport": {
        "_id": "60d5ec49eb2c6a1234567892",
        "sessionId": "12345",
        "message": "Jalan rusak parah"
      }
    }
  ],
  "sessions": [
    {
      "_id": "60d5ec49eb2c6a1234567893",
      "loginTime": "2025-07-01T08:00:00.000Z",
      "logoutTime": "2025-07-01T17:00:00.000Z",
      "sessionDuration": 540,
      "isActive": false,
      "activityCount": 25
    }
  ],
  "processedReports": [
    {
      "_id": "60d5ec49eb2c6a1234567892",
      "sessionId": "12345",
      "message": "Jalan rusak parah",
      "createdAt": "2025-07-01T09:00:00.000Z",
      "tindakan": {
        "status": "Selesai Penanganan",
        "trackingId": 100123
      }
    }
  ],
  "dateRange": {
    "start": "2025-06-01T00:00:00.000Z",
    "end": "2025-07-01T23:59:59.999Z"
  }
}
```

### 3. Status Online Real-time
**GET** `/performance/status`

Response:
```json
{
  "totalOnline": 3,
  "totalActive": 5,
  "adminList": [
    {
      "adminId": "60d5ec49eb2c6a1234567890",
      "adminName": "John Doe",
      "role": "Admin",
      "loginTime": "2025-07-01T08:00:00.000Z",
      "lastActivity": "2025-07-01T10:25:00.000Z",
      "sessionDuration": 145,
      "activityCount": 12,
      "isOnline": true
    }
  ]
}
```

### 4. Laporan Bulanan
**GET** `/performance/monthly`

Query Parameters:
- `year` (optional): 2025
- `month` (optional): 7

Response:
```json
{
  "period": {
    "year": 2025,
    "month": 7,
    "startDate": "2025-07-01T00:00:00.000Z",
    "endDate": "2025-07-31T23:59:59.999Z"
  },
  "totalActivities": 1250,
  "totalReportsProcessed": 345,
  "avgResponseTime": 0,
  "adminProductivity": []
}
```

## Authentication
Semua endpoint memerlukan authentication melalui middleware `authMiddleware`. Token harus disertakan dalam header:
```
Authorization: Bearer <token>
```

## Activity Tracking

### Automatic Tracking
Sistem otomatis melacak:
- Login/logout admin
- Pemrosesan laporan (assign, update status, update OPD, upload evidence)
- Aktivitas sistem lainnya

### Manual Tracking
Untuk tracking manual, gunakan service `ActivityTracker`:

```javascript
const ActivityTracker = require('../services/activityTracker');

// Track login
await ActivityTracker.trackLogin(adminId, ipAddress, userAgent);

// Track logout  
await ActivityTracker.trackLogout(adminId, sessionId);

// Track report processing
await ActivityTracker.trackReportProcessing(adminId, reportId, tindakanId, action, description);

// Track system action
await ActivityTracker.trackSystemAction(adminId, action, description, metadata);
```

### Report Tracking Utilities
Untuk tracking operasi laporan, gunakan `ReportTrackingUtil`:

```javascript
const ReportTrackingUtil = require('../services/reportTrackingUtil');

// Track status update
await ReportTrackingUtil.trackStatusUpdate(adminId, reportId, tindakanId, oldStatus, newStatus);

// Track OPD update
await ReportTrackingUtil.trackOpdUpdate(adminId, reportId, tindakanId, opdList);

// Track evidence upload
await ReportTrackingUtil.trackEvidenceUpload(adminId, reportId, tindakanId, fileCount);
```

## Scheduled Tasks

### Auto Logout
Sistem otomatis logout session yang tidak aktif lebih dari 60 menit setiap 5 menit.

### Data Cleanup
Sistem otomatis menghapus:
- Data aktivitas lebih dari 90 hari (setiap hari jam 2 pagi)
- Session data lebih dari 30 hari (setiap hari jam 2 pagi)

## Models

### AdminActivity
- Tracks all admin activities (login, logout, report processing, etc.)
- Contains metadata about each activity
- Indexed for performance

### AdminSession  
- Tracks login/logout sessions
- Calculates session duration
- Monitors active status and last activity

## Usage Examples

### Frontend Dashboard Integration
```javascript
// Get dashboard data
const response = await fetch('/performance/dashboard?startDate=2025-06-01&endDate=2025-07-01');
const dashboardData = await response.json();

// Get real-time admin status
const statusResponse = await fetch('/performance/status');
const onlineStatus = await statusResponse.json();

// Get specific admin details
const adminResponse = await fetch('/performance/admin/60d5ec49eb2c6a1234567890');
const adminDetails = await adminResponse.json();
```

### Track Custom Activity
```javascript
// In your route handler
const { userId } = req.user;
await ReportTrackingUtil.trackStatusUpdate(userId, reportId, tindakanId, 'old_status', 'new_status');
```

## Troubleshooting

### Common Issues

#### 1. CastError: Cast to Number failed for sessionDuration
**Problem**: Error occurs during login tracking when trying to update session duration.

**Solution**: Fixed in `services/activityTracker.js` by properly calculating session duration before database update:

```javascript
// Fixed: Calculate duration before update
const sessionDurationMinutes = Math.round((new Date() - session.loginTime) / (1000 * 60));
await AdminSession.updateOne(
    { _id: session._id },
    { 
        isActive: false, 
        logoutTime: new Date(),
        sessionDuration: sessionDurationMinutes
    }
);
```

#### 2. Missing ReportTrackingUtil Import
**Problem**: `ReportTrackingUtil is not defined` error in tindakanRoutes.

**Solution**: Added import statement:
```javascript
const ReportTrackingUtil = require("../services/reportTrackingUtil");
```

#### 3. Tracking Errors Blocking Main Operations
**Problem**: Activity tracking errors prevent main functionality.

**Solution**: Added try-catch wrapper around tracking operations:
```javascript
try {
    await ReportTrackingUtil.trackStatusUpdate(adminId, reportId, tindakanId, oldStatus, newStatus);
} catch (trackingError) {
    console.error('Error tracking activity:', trackingError);
    // Don't block the main operation if tracking fails
}
```

### Testing

Run the performance API test suite:
```bash
node test-performance.js
```

Access the dashboard:
```
http://localhost:3001/public/admin-performance-dashboard.html
```

### Manual Testing Endpoints

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get dashboard (replace TOKEN with actual token)
curl -X GET "http://localhost:3001/performance/dashboard" \
  -H "Authorization: Bearer TOKEN"

# Get admin status
curl -X GET "http://localhost:3001/performance/status" \
  -H "Authorization: Bearer TOKEN"

# Get monthly report
curl -X GET "http://localhost:3001/performance/monthly?year=2025&month=7" \
  -H "Authorization: Bearer TOKEN"
```

## Performance Considerations

### Database Indexing
Models are optimized with proper indexing:
- `AdminActivity`: Indexed on admin, activityType, and createdAt
- `AdminSession`: Indexed on admin, isActive, loginTime, and lastActivity

### Data Cleanup
Automatic cleanup prevents database bloat:
- Activity data older than 90 days is automatically deleted
- Session data older than 30 days is automatically deleted

### Memory Usage
- Aggregation pipelines are optimized for large datasets
- Queries use proper field selection to minimize memory usage
