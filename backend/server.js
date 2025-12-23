const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db'); // Import koneksi DB
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes'); // utk admin
dotenv.config();

//IMPORT LIBRARY KEAMANAN
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// Setup Socket.io dengan CORS (Agar Frontend Next.js di port 3000 bisa akses)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Alamat Frontend
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware
app.use(cors());
app.use(express.json()); // Agar bisa baca JSON dari request body

app.use(helmet());// HELMET: Melindungi dari berbagai serangan HTTP Headers (XSS, Clickjacking, Sniffing, dll) 
// --- SOCKET.IO CONNECTION ---
io.on('connection', (socket) => {
    console.log('⚡ A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // Durasi: 15 Menit
	max: 100, // Maksimal 100 request per IP dalam durasi tersebut
	standardHeaders: true, // Info limit di header (RateLimit-*)
	legacyHeaders: false, // Nonaktifkan header X-RateLimit-* lama
    message: "Terlalu banyak request dari IP ini, coba lagi nanti."
});
app.use(limiter);
// --- ROUTES SEDERHANA (TESTING) ---
app.get('/', (req, res) => {
    res.send('Backend Kantin FPMIPA is Running!');
});

// Simpan io di dalam request agar bisa dipakai di Controller nanti
app.use((req, res, next) => {
    req.io = io;
    next();
});




// Gunakan Route
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

// --- JALANKAN SERVER ---
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
});