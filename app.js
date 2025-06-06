require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cron = require("node-cron");

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

const app = express();
const server = createServer(app);
const corsOptions = {
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
};

const io = new Server(server, {
    cors: corsOptions
});

global.io = io;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Koneksi ke MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

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

// Apply authMiddleware to all routes except /webhook
app.use(authMiddleware);

app.use("/chat", messageRoutes);
app.use("/user", userRoutes);
app.use("/reports", reportRoutes);
app.use("/reportCount", reportCountRoutes);
app.use("/tindakan", tindakanRoutes);
app.use("/api", tindakanUploadRoute);
app.use("/dashboard", dashboardRoute);
app.use("/userLogin", userLogin);
app.use("/auth", login);

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/uploadsTindakan", express.static(path.join(__dirname, "public/uploadsTindakan")));
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// Route default untuk cek server berjalan
app.get("/", (req, res) => {
    res.send("✅ Server berjalan dengan baik!");
});

cron.schedule("0 0 * * *", () => {
    autoCloseFeedback();
});

// Menjalankan server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
});
