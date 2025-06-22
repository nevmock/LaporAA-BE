const mongoose = require('mongoose');
const environment = require('./environment').getConfig();

class DatabaseConfig {
  static async connect() {
    try {
      // Handle connection events
      mongoose.connection.on('connected', () => {
        console.log('✅ Mongoose connected to MongoDB');
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ Mongoose connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ Mongoose disconnected from MongoDB');
      });

      // Graceful exit
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('✅ Mongoose connection closed through app termination');
        process.exit(0);
      });

      await mongoose.connect(
        environment.database.uri,
        environment.database.options
      );
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
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
    return states[mongoose.connection.readyState] || 'unknown';
  }
}

module.exports = DatabaseConfig;
