const express = require("express");
const ServerConfig = require("./config/server");
const rateLimit = require("express-rate-limit");

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

const autoCloseFeedback = require("./utils/autoCloseFeedback");

const corsOptions = {
  origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
};
const limiter = rateLimit({
  windowMs: process.env.PERIOD_LIMITER,
  max: process.env.MAX_LIMITER_REQUEST,
  message: "Terlalu banyak request, coba lagi setelah 24 jam.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json());
// app.use(limiter);

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
app.use("/user", userRoutes);

// Apply authMiddleware to all routes except /webhook
app.use(authMiddleware);

app.use("/reports", reportRoutes);
app.use("/reportCount", reportCountRoutes);
app.use("/tindakan", tindakanRoutes);
app.use("/api", tindakanUploadRoute);
app.use("/dashboard", dashboardRoute);

// Route default untuk cek server berjalan
app.get("/", (req, res) => {
  res.send("✅ Server berjalan dengan baik!");
});

if (process.env.NODE_ENV !== 'test') {
  cron.schedule("0 0 * * *", () => {
    autoCloseFeedback();
  });
}
