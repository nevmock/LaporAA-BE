/**
 * VPS-Optimized Socket.IO Configuration
 * 
 * This configuration is specifically designed for VPS environments where:
 * - Network latency might be higher
 * - WebSocket connections might be unstable
 * - Proxy servers might interfere with WebSocket upgrades
 * - Resource constraints require efficient connection management
 */

class VPSSocketConfig {
  static getConfig() {
    return {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["*"],
        credentials: true
      },
      
      // VPS-optimized transport configuration
      transports: ['polling', 'websocket'], // Prioritize polling for VPS stability
      allowEIO3: true,
      
      // Conservative timeout settings for VPS
      pingTimeout: 60000,       // 60 seconds
      pingInterval: 25000,      // 25 seconds
      upgradeTimeout: 30000,    // 30 seconds
      connectTimeout: 20000,    // 20 seconds
      
      // Resource management for VPS
      maxHttpBufferSize: 1e6,   // 1 MB (conservative for VPS)
      allowUpgrades: true,      // Allow WebSocket upgrades if possible
      
      // Cleanup and recovery
      cleanupEmptyChildNamespaces: true,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      },
      
      // VPS-specific optimizations
      serveClient: false,       // Don't serve client files (save bandwidth)
      cookie: false,           // Disable cookies for better performance
      
      // Error handling
      path: "/socket.io/",     // Explicit path
      destroyUpgrade: true,    // Destroy incomplete upgrades
      destroyUpgradeTimeout: 1000, // Quick timeout for upgrade destruction
    };
  }
  
  /**
   * Get development configuration (more permissive)
   */
  static getDevConfig() {
    const config = this.getConfig();
    return {
      ...config,
      transports: ['websocket', 'polling'], // Allow WebSocket first in dev
      connectTimeout: 10000,    // Faster timeout in dev
      pingTimeout: 30000,       // Shorter timeout in dev
    };
  }
  
  /**
   * Get production configuration (most conservative)
   */
  static getProdConfig() {
    const config = this.getConfig();
    return {
      ...config,
      transports: ['polling'],  // Polling-only for maximum stability
      connectTimeout: 30000,    // Longer timeout for prod
      pingTimeout: 90000,       // Longer timeout for prod
    };
  }
}

module.exports = VPSSocketConfig;
