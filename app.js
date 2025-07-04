const express = require("express");
const ServerConfig = require("./config/server");
const rateLimit = require("express-rate-limit");
// const limitMiddleware = require("./middleware/limitMiddleware");

const serverConfig = new ServerConfig();
const app = serverConfig.getApp();
const server = serverConfig.getServer();

const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");

const { Server } = require("socket.io");

// Initialize socket.io with CORS config here
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  }
});

// Set io to app for use in routes
app.set("io", io);

// Set global.io for usage in other modules like messageController.js
global.io = io;

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

const autoCloseFeedback = require("./utils/autoCloseFeedback");
const limitMiddleware = require("./middlewares/limitMiddleware");
const activityTrackingMiddleware = require("./middlewares/activityTrackingMiddleware");
const PerformanceScheduler = require("./utils/performanceScheduler");

const corsOptions = {
  origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
};

// app.set('trust proxy', 1);

// Middleware
app.use(cors());
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

// 🔵 WebSocket Connection
io.on("connection", (socket) => {
  console.log(`🟢 User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
  });
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
app.use("/user-profile", userProfileRoutes);
app.use("/geojson", geojsonRoutes); // Routes untuk GeoJSON data

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
