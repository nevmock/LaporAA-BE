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

// Initialize socket.io with 24-hour timeout (extremely long connection)
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["*"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 86400000,    // 24 hours (24 * 60 * 60 * 1000)
  pingInterval: 86400000,   // 24 hours ping interval
  upgradeTimeout: 86400000, // 24 hours upgrade timeout
  maxHttpBufferSize: 1e8,   // 100 MB
  // Enhanced connection handling with 24-hour timeouts
  connectTimeout: 86400000, // 24 hours connection timeout
  allowUpgrades: true,
  // Keep connections alive for 24 hours
  heartbeatTimeout: 86400000,
  heartbeatInterval: 86400000
});

// Set io to app for use in routes
app.set("io", io);

// Set global.io for usage in other modules like messageController.js
global.io = io;

// Initialize event optimizer
const eventOptimizer = new BackendEventOptimizer(io);
app.set("eventOptimizer", eventOptimizer);

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
    server.listen(PORT, () => {
      console.log(`🚀 Server berjalan di port ${PORT}`);
    });
  }
}).catch(err => console.error("❌ MongoDB Connection Error:", err));

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
  console.log(`🟢 User connected: ${socket.id}`);
  console.log(`✅ New client connected: ${socket.id}`);

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
      socket.join('global'); // Everyone joins global room
      
      if (role === 'admin' || role === 'super-admin') {
        socket.join('admins');
        socket.join(`admin-${userId}`);
        console.log(`✅ Admin ${userId} joined admin rooms`);
      } else {
        socket.join(`user-${userId}`);
        if (sessionId) {
          socket.join(`chat-${sessionId}`);
        }
        console.log(`✅ User ${userId} joined user rooms`);
      }
      
      socket.emit("authenticated", { success: true, rooms: Array.from(socket.rooms) });
      
    } catch (error) {
      console.error("❌ Authentication error:", error);
      socket.emit("authenticationError", { error: "Authentication failed" });
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
    console.log(`🔴 User disconnected: ${socket.id}`);
    console.log(`❌ Client disconnected: ${socket.id} Reason: ${reason}`);
    
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
      await sendMessageToWhatsApp(to, finalMessage, mode);
      
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

  // Auto-emit admin online status when admin connects
  socket.emit("adminOnlineStatus", { status: "online" });
});

// Global error handler for Socket.IO
io.engine.on("connection_error", (err) => {
    console.error("❌ Socket.IO connection error:", err.req);
    console.error("❌ Error code:", err.code);
    console.error("❌ Error message:", err.message);
    console.error("❌ Error context:", err.context);
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
