// RECOMMENDED CHANGES FOR app.js

// Replace the current MongoDB connection (around line 103):

// OLD CODE (PROBLEMATIC):
/*
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("✅ MongoDB Connected");
  // server setup...
}).catch(err => console.error("❌ MongoDB Connection Error:", err));
*/

// NEW CODE (ROBUST):

const mongoose = require("mongoose");

// Enhanced MongoDB connection with proper timeout settings
const connectDB = async () => {
  try {
    const connectionOptions = {
      // Connection Pool Settings
      maxPoolSize: 20,          // Increased from default 10
      minPoolSize: 5,           // Maintain minimum connections
      maxIdleTimeMS: 30000,     // Close idle connections after 30s
      
      // Timeout Settings (REASONABLE - NOT 24 hours!)
      serverSelectionTimeoutMS: 10000,  // 10 seconds to find server
      socketTimeoutMS: 60000,           // 60 seconds for operations
      connectTimeoutMS: 30000,          // 30 seconds to connect
      
      // Retry and Reliability
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 10000,      // Health check every 10s
      
      // Buffer Settings
      bufferMaxEntries: 0,      // Disable mongoose buffering
      bufferCommands: false,    // Disable mongoose buffering
      
      // Additional Production Settings
      family: 4,                // IPv4 only
      keepAlive: true,
      keepAliveInitialDelay: 300000,  // 5 minutes
    };

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err.message);
      if (err.message.includes('ETIMEDOUT')) {
        console.log('🔄 ETIMEDOUT detected - will retry automatically');
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected - attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected successfully');
    });

    // Connect with enhanced options
    await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    console.log("✅ MongoDB Connected with optimized settings");
    
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.log("🔄 App will continue, connection will retry automatically");
    return false;
  }
};

// Initialize connection and start server
const startServer = async () => {
  // Try to connect to MongoDB
  await connectDB();
  
  // Start server regardless of DB connection status
  // (MongoDB will reconnect automatically)
  const PORT = process.env.PORT || 3000;
  if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 MongoDB connection: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
    });
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// ALSO UPDATE SCHEDULER IMPORT:
// Replace:
// const PerformanceScheduler = require("./utils/performanceScheduler");
// PerformanceScheduler.init();

// With:
const RobustPerformanceScheduler = require("./utils/robustPerformanceScheduler");
RobustPerformanceScheduler.init();
