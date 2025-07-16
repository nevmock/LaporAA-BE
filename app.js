const express = require("express");
const ServerConfig = require("./config/server");
const rateLimit = require("express-rate-limit");
const BackendEventOptimizer = require("./services/eventOptimizer");
// const limitMiddleware = require("./middleware/limitMiddleware");

const serverConfig = new ServerConfig();
const app = serverConfig.getApp();
const server = serverConfig.getServer();

const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");

const { Server } = require("socket.io");

// Get VPS-optimized socket configuration with fallback
let socketConfig;
try {
  const VPSSocketConfig = require("./config/vps-socket");
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  socketConfig = isProduction ? 
    VPSSocketConfig.getProdConfig() : 
    isDevelopment ? 
      VPSSocketConfig.getDevConfig() : 
      VPSSocketConfig.getConfig();
  
  console.log(`🔧 Using ${isProduction ? 'PRODUCTION' : isDevelopment ? 'DEVELOPMENT' : 'DEFAULT'} socket configuration`);
  console.log(`🚀 Transport priority: ${socketConfig.transports.join(', ')}`);
} catch (error) {
  console.error('❌ VPS socket config error, using fallback:', error.message);
  // Fallback configuration
  socketConfig = {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["*"],
      credentials: true
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    connectTimeout: 20000,
    maxHttpBufferSize: 1e6,
    allowUpgrades: true,
    cleanupEmptyChildNamespaces: true,
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
    serveClient: false,
    cookie: false,
    path: "/socket.io/",
    destroyUpgrade: true,
    destroyUpgradeTimeout: 1000,
  };
  console.log('🔧 Using FALLBACK socket configuration');
  console.log('🚀 Transport priority: polling, websocket');
}

// Initialize socket.io with VPS-optimized configuration
let io;
try {
  console.log('🔧 Initializing Socket.IO server...');
  io = new Server(server, socketConfig);
  console.log('✅ Socket.IO server initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Socket.IO server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

// Set io to app for use in routes
app.set("io", io);

// Set global.io for usage in other modules like messageController.js
global.io = io;

// Set global.socketIO as alternative reference untuk backward compatibility
global.socketIO = io;

// Initialize event optimizer
let eventOptimizer;
try {
  console.log('🔧 Initializing event optimizer...');
  eventOptimizer = new BackendEventOptimizer(io);
  app.set("eventOptimizer", eventOptimizer);
  console.log('✅ Event optimizer initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize event optimizer:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

const webhookRoutes = require("./routes/webhookRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const reportCountRoutes = require("./routes/reportCount");
const tindakanRoutes = require("./routes/tindakanRoutes");
const tindakanUploadRoute = require("./routes/tindakanUpload");
const dashboardRoute = require("./routes/dashboardRoute");
const userLogin = require("./routes/userLogin");
const login = require("./routes/auth");
const authMiddleware = require("./middlewares/authMiddleware");
const fix = require("./routes/fixApi");
const modeRoutes = require("./routes/modeRoutes");
const userProfileRoutes = require("./routes/userProfileRoutes");
const geojsonRoutes = require("./routes/geojsonRoutes");
const adminPerformanceRoutes = require("./routes/adminPerformance");
const modeManagementRoutes = require("./routes/modeManagementRoutes");
const fileManagementRoutes = require("./routes/fileManagementRoutes");
const fileOrganizationRoutes = require("./routes/fileOrganizationRoutes");

const autoCloseFeedback = require("./utils/autoCloseFeedback");
const limitMiddleware = require("./middlewares/limitMiddleware");
const activityTrackingMiddleware = require("./middlewares/activityTrackingMiddleware");
const PerformanceScheduler = require("./utils/performanceScheduler");

const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["*"],
  credentials: true
};

// app.set('trust proxy', 1);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// app.use(limitMiddleware);

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected from DB');
});

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("✅ MongoDB Connected");

  // Menjalankan server hanya jika bukan environment test
  const PORT = process.env.PORT || 3000;
  if (process.env.NODE_ENV !== 'test') {
    try {
      server.listen(PORT, () => {
        console.log(`🚀 Server berjalan di port ${PORT}`);
        console.log(`📡 Socket.IO ready on port ${PORT}`);
        console.log(`🌐 Health check available at http://localhost:${PORT}/health`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}).catch(err => {
  console.error("❌ MongoDB Connection Error:", err);
  console.error("Stack trace:", err.stack);
  process.exit(1);
});

// Enhanced socket event emitters for room-based targeting with optimization
const emitToAdmins = (event, data) => {
    eventOptimizer.emitToRooms(['admins'], event, data);
};

const emitToUser = (userId, event, data) => {
    eventOptimizer.emitToRooms([`user-${userId}`], event, data);
};

const emitToChat = (sessionId, event, data) => {
    eventOptimizer.emitToRooms([`chat-${sessionId}`], event, data);
};

const emitGlobalUpdate = (event, data) => {
    eventOptimizer.emitToRooms(['global'], event, data);
};

// Room management for socket connections
const connectedUsers = new Map(); // socketId -> user info
const userSockets = new Map(); // userId -> Set of socketIds

// 🔵 WebSocket Connection with enhanced error handling
io.on("connection", (socket) => {
  // User connected

  // Handle authentication and room joining
  socket.on("authenticate", async (data) => {
    try {
      const { token, userId, role, sessionId } = data;
      
      // TODO: Validate token here if needed
      
      // Store user information
      const userInfo = {
        userId,
        role,
        sessionId,
        socketId: socket.id,
        joinedAt: new Date()
      };
      
      connectedUsers.set(socket.id, userInfo);
      
      // Track user sockets
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      
      // Join appropriate rooms based on role
      if (role === 'Admin' || role === 'SuperAdmin' || role === 'Bupati') {
        socket.join('admins');
        console.log(`👤 Admin ${userId} joined admins room`);
      }
      
      // Join global room for all users
      socket.join('global');
      
      // Join user-specific room
      socket.join(`user-${userId}`);
      
      // Join session-specific room if provided
      if (sessionId) {
        socket.join(`chat-${sessionId}`);
      }
      
      console.log(`🔌 User ${userId} (${role}) authenticated and joined rooms`);
    } catch (error) {
      console.error('❌ Authentication error:', error);
      socket.emit('auth-error', { message: 'Authentication failed' });
    }
  });

  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
  });

  socket.on("error", (error) => {
    console.error("❌ Socket error:", error);
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    // User disconnected
    
    // Clean up user tracking
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      const userSocketSet = userSockets.get(userInfo.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userInfo.userId);
        }
      }
      connectedUsers.delete(socket.id);
    }
  });

  // Handle send message from dashboard
  socket.on("sendMessage", async (data) => {
    try {
      const { to, message, nama_admin, role } = data;
      
      // Import message controller
      const { sendMessageToWhatsApp } = require("./controllers/messageController");
      const UserSession = require("./models/UserSession");
      
      // Get session mode
      const session = await UserSession.findOne({ from: to, status: "in_progress" });
      const mode = session?.mode || "bot";
      
      // Format message with admin label if in manual mode
      let finalMessage = message;
      if (mode === "manual") {
        let label = "";
        if (role === "Admin") {
          label = `\n\n-Admin${nama_admin ? " : " + nama_admin : ""}`;
        } else if (role === "SuperAdmin") {
          label = "\n\n-Superadmin";
        } else if (role === "Bupati") {
          label = "\n\n-Bupati";
        }
        finalMessage = message + label;
      }
      
      // Send message via WhatsApp
      await sendMessageToWhatsApp(to, finalMessage, mode, true);
      
      // Emit back to appropriate rooms
      const messagePayload = {
        from: to,
        senderName: "Admin",
        message: finalMessage,
        timestamp: new Date()
      };
      
      // Emit to admins and global rooms
      emitToAdmins("newMessage", messagePayload);
      emitGlobalUpdate("newMessage", messagePayload);
      
      // If chat session exists, emit to chat room
      if (session?.session_id) {
        emitToChat(session.session_id, "newMessage", messagePayload);
      }
      
    } catch (error) {
      console.error("❌ Error sending message via socket:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // Real-time enhancement socket handlers
  
  // Handle admin typing indicator
  socket.on("adminTyping", (data) => {
    const { userId, isTyping } = data;
    console.log(`👤 Admin typing indicator: ${userId} - ${isTyping}`);
    
    // Emit to all other connected clients
    socket.broadcast.emit("userTyping", {
      userId,
      isTyping
    });
  });

  // Handle message read receipts
  socket.on("markMessageRead", (data) => {
    const { messageId, userId } = data;
    console.log(`📖 Message read: ${messageId} by ${userId}`);
    
    // Emit to admins and global rooms
    const readData = { messageId, userId };
    emitToAdmins("messageRead", readData);
    emitGlobalUpdate("messageRead", readData);
  });

  // Handle admin online status
  socket.on("adminOnlineStatus", (data) => {
    const { status } = data;
    console.log(`👤 Admin online status: ${status}`);
    
    // Emit to admins and global rooms
    emitToAdmins("adminOnlineStatus", { status });
    emitGlobalUpdate("adminOnlineStatus", { status });
  });

  // Handle user online status
  socket.on("userOnlineStatus", (data) => {
    const { userId, status } = data;
    console.log(`👤 User online status: ${userId} - ${status}`);
    
    // Emit to admins for monitoring
    emitToAdmins("userOnline", { userId, status });
  });

  // Handle message status updates
  socket.on("updateMessageStatus", (data) => {
    const { messageId, status } = data;
    console.log(`📊 Message status update: ${messageId} - ${status}`);
    
    // Emit to admins and global rooms
    const statusData = { messageId, status };
    emitToAdmins("messageStatus", statusData);
    emitGlobalUpdate("messageStatus", statusData);
  });

  // ----------------------- REALTIME TOGGLE SYNC HANDLERS -----------------------
  
  // Handle pin toggle broadcast
  socket.on("report-pin-toggle", (data) => {
    const { sessionId, isPinned, userId, timestamp } = data;
    
    // Broadcast to all other clients (except sender)
    socket.broadcast.emit("report-pin-toggled", {
      sessionId,
      isPinned,
      userId,
      timestamp
    });
    
    // Also emit to admin rooms for monitoring
    emitToAdmins("report-pin-toggled", {
      sessionId,
      isPinned,
      userId,
      timestamp
    });
  });

  // Handle force mode toggle broadcast
  socket.on("report-force-mode-toggle", (data) => {
    const { from, forceMode, userId, timestamp } = data;
    
    // Broadcast to all other clients (except sender)
    socket.broadcast.emit("report-force-mode-toggled", {
      from,
      forceMode,
      userId,
      timestamp
    });
    
    // Also emit to admin rooms for monitoring
    emitToAdmins("report-force-mode-toggled", {
      from,
      forceMode,
      userId,
      timestamp
    });
  });

  // Handle prioritas toggle broadcast
  socket.on("report-prioritas-toggle", (data) => {
    const { sessionId, tindakanId, prioritas, userId, timestamp } = data;
    
    // Broadcast to all other clients (except sender)
    socket.broadcast.emit("report-prioritas-toggled", {
      sessionId,
      tindakanId,
      prioritas,
      userId,
      timestamp
    });
    
    // Also emit to admin rooms for monitoring
    emitToAdmins("report-prioritas-toggled", {
      sessionId,
      tindakanId,
      prioritas,
      userId,
      timestamp
    });
  });

  // ----------------------- TEST EVENT HANDLER -----------------------
  // Handle test event untuk debugging socket communication
  socket.on("test-event", (data) => {
    console.log(`🧪 Test event received:`, data);
    
    // Echo back to sender
    socket.emit("test-response", {
      message: "Test received by backend",
      originalData: data,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
    
    // Broadcast to all other clients
    socket.broadcast.emit("test-broadcast", {
      message: "Test broadcast from backend",
      originalData: data,
      fromSocketId: socket.id,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🧪 Test response and broadcast sent`);
  });

  // Auto-emit admin online status when admin connects
  socket.emit("adminOnlineStatus", { status: "online" });
});

// Global error handler for Socket.IO with enhanced logging
io.engine.on("connection_error", (err) => {
    console.error("❌ Socket.IO connection error details:");
    console.error("   Request:", err.req?.url || 'unknown');
    console.error("   Error code:", err.code);
    console.error("   Error message:", err.message);
    console.error("   Error context:", err.context);
    console.error("   Headers:", err.req?.headers || {});
    
    // Log specific error patterns
    if (err.message?.includes('websocket error')) {
        console.error("🔧 WebSocket specific error - client will fallback to polling");
    }
    
    if (err.code === 'ECONNRESET') {
        console.error("🔧 Connection reset - likely client disconnected abruptly");
    }
    
    if (err.code === 'ETIMEDOUT') {
        console.error("🔧 Connection timeout - check network connectivity");
    }
});

// Handle server-side socket errors
io.on("error", (error) => {
    console.error("❌ Socket.IO server error:", error);
});

// Monitor connection counts
let connectionCount = 0;
io.on("connection", (socket) => {
    connectionCount++;
    console.log(`🟢 User connected: ${socket.id} (Total: ${connectionCount})`);
    
    // Monitor client connection health
    const connectionHealth = setInterval(() => {
        if (socket.connected) {
            socket.emit('ping', { timestamp: Date.now() });
        } else {
            clearInterval(connectionHealth);
        }
    }, 30000); // Ping every 30 seconds
    
    socket.on('disconnect', () => {
        connectionCount--;
        clearInterval(connectionHealth);
        console.log(`🔴 User disconnected: ${socket.id} (Total: ${connectionCount})`);
    });
    
    // Handle pong responses
    socket.on('pong', (data) => {
        const latency = Date.now() - data.timestamp;
        console.log(`💓 Pong from ${socket.id}: ${latency}ms`);
    });
    
    // Rest of your socket handling code...
});

// Simpan WebSocket ke app agar bisa digunakan di route lain
app.set("io", io);

// Routes
app.use("/webhook", webhookRoutes);
app.use("/userLogin", userLogin);
app.use("/auth", login);
app.use("/chat", messageRoutes);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/uploadsTindakan", express.static(path.join(__dirname, "public/uploadsTindakan")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/user", userRoutes);
app.use("/fix", fix);
app.use("/mode", modeRoutes); // Routes terpusat untuk pengelolaan mode
app.use("/mode-management", modeManagementRoutes); // Enhanced mode management routes
app.use("/user-profile", userProfileRoutes);
app.use("/geojson", geojsonRoutes); // Routes untuk GeoJSON data
app.use("/files", fileManagementRoutes); // File management routes
app.use("/api/file-organization", fileOrganizationRoutes); // File organization routes

// 🔵 Performance Dashboard Route
app.get("/dashboard/performance", (req, res) => {
    res.sendFile(path.join(__dirname, "public/admin-performance-dashboard.html"));
});

// Apply authMiddleware to all routes except /webhook
app.use(authMiddleware);

// Apply activity tracking middleware to authenticated routes
app.use(activityTrackingMiddleware());

app.use("/reports", reportRoutes);
app.use("/dashboard", dashboardRoute); 
app.use("/reportCount", reportCountRoutes);
app.use("/tindakan", tindakanRoutes);
app.use("/api", tindakanUploadRoute);
app.use("/performance", adminPerformanceRoutes);
app.use("/mode-management", modeManagementRoutes); // New route for mode management

// Route default untuk cek server berjalan
app.get("/", (req, res) => {
  res.send("✅ Server berjalan dengan baik!");
});

if (process.env.NODE_ENV !== 'test') {
  cron.schedule("0 0 * * *", () => {
    autoCloseFeedback();
  });
  
  // Initialize performance tracking scheduler
  PerformanceScheduler.init();
}
