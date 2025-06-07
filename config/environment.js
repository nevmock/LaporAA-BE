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
        options: {}
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
