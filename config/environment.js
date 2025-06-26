require('dotenv').config();

class EnvironmentConfig {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    return {
      server: {
        port: parseInt(process.env.PORT) || 3000,
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        uri: process.env.MONGO_URI,
        options: {
          maxPoolSize: 10, // Maintain up to 10 socket connections
          serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
          bufferMaxEntries: 0, // Disable mongoose buffering
          bufferCommands: false, // Disable mongoose buffering
          retryWrites: true,
          retryReads: true
        }
      },
      cron: {
        autoCloseFeedback: process.env.CRON_AUTO_CLOSE_FEEDBACK || '0 0 * * *',
        cleanupLogs: process.env.CRON_CLEANUP_LOGS || '0 2 * * 0'
      }
    };
  }

  getConfig() {
    return this.config;
  }

  get(section) {
    return this.config[section];
  }
}

module.exports = new EnvironmentConfig();
