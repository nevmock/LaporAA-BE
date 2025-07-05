const mongoose = require('mongoose');
const environment = require('./environment').getConfig();

class OptimizedDatabaseConfig {
  static async connect() {
    try {
      // Enhanced connection options for production stability
      const connectionOptions = {
        // Connection Pool Settings
        maxPoolSize: 20,          // Increase pool size for concurrent operations
        minPoolSize: 5,           // Maintain minimum connections
        maxIdleTimeMS: 30000,     // Close connections after 30 seconds of inactivity
        
        // Timeout Settings (REASONABLE, not 24 hours)
        serverSelectionTimeoutMS: 10000,  // 10 seconds to select server
        socketTimeoutMS: 60000,           // 60 seconds for socket operations
        connectTimeoutMS: 30000,          // 30 seconds to establish connection
        
        // Retry and Reliability
        retryWrites: true,
        retryReads: true,
        heartbeatFrequencyMS: 10000,      // Check server health every 10 seconds
        
        // Buffer Settings
        bufferMaxEntries: 0,      // Disable mongoose buffering
        bufferCommands: false,    // Disable mongoose buffering
        
        // Additional Production Settings
        family: 4,                // Use IPv4, skip trying IPv6
        keepAlive: true,
        keepAliveInitialDelay: 300000,  // 5 minutes
      };

      // Handle connection events BEFORE connecting
      mongoose.connection.on('connected', () => {
        console.log('✅ Mongoose connected to MongoDB');
        console.log(`🔗 Connection pool: ${mongoose.connection.readyState}`);
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err.message);
        // Don't exit on connection error - let it retry
        if (err.message.includes('ETIMEDOUT')) {
          console.log('🔄 ETIMEDOUT detected - connection will retry automatically');
        }
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ Mongoose disconnected from MongoDB');
        console.log('🔄 Attempting reconnection...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 Mongoose reconnected to MongoDB');
      });

      mongoose.connection.on('reconnectFailed', () => {
        console.error('❌ Mongoose reconnection failed');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.log('🛑 Received SIGINT, closing MongoDB connection...');
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed gracefully');
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('🛑 Received SIGTERM, closing MongoDB connection...');
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed gracefully');
        process.exit(0);
      });

      // Connect with enhanced options
      await mongoose.connect(environment.database.uri, connectionOptions);
      
      console.log('✅ Connected to MongoDB with optimized settings');
      console.log(`📊 Connection pool size: ${connectionOptions.maxPoolSize}`);
      console.log(`⏱️ Socket timeout: ${connectionOptions.socketTimeoutMS}ms`);
      
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      
      // Don't throw error - let the app start and retry connection
      console.log('🔄 Will retry connection automatically...');
    }
  }

  static async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ MongoDB disconnection error:', error);
      throw error;
    }
  }

  static getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    const status = states[mongoose.connection.readyState] || 'unknown';
    
    return {
      status,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      poolSize: mongoose.connection.readyState === 1 ? 'active' : 'inactive'
    };
  }

  // Health check method
  static async healthCheck() {
    try {
      const status = this.getConnectionStatus();
      
      if (status.status !== 'connected') {
        return { healthy: false, status };
      }

      // Test database operation
      await mongoose.connection.db.admin().ping();
      
      return { 
        healthy: true, 
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = OptimizedDatabaseConfig;
