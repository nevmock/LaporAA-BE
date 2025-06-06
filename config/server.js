const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

class ServerConfig {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);
  }

  getApp() {
    return this.app;
  }

  getServer() {
    return this.server;
  }

  getIO() {
    return this.io;
  }

  async start(port) {
    return new Promise((resolve, reject) => {
      this.server.listen(port, () => {
        resolve();
      });
      this.server.on('error', err => {
        reject(err);
      });
    });
  }

  async shutdown() {
    return new Promise((resolve, reject) => {
      this.server.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  setupErrorHandling() {
    this.app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    });
  }
}

module.exports = ServerConfig;
