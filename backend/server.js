const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db'); // Import koneksi DB
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes'); // utk admin
const cron = require('node-cron'); // IMPORT CRON JOB

dotenv.config();

// IMPORT LIBRARY KEAMANAN
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// Setup Socket.io dengan CORS
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Alamat Frontend
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware
app.use(cors());
app.use(express.json()); 
app.use(helmet()); // HELMET: Melindungi dari berbagai serangan HTTP Headers (XSS, Clickjacking, Sniffing, dll)

// --- SOCKET.IO CONNECTION ---
io.on('connection', (socket) => {
    console.log('⚡ A user connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 100, 
	standardHeaders: true, 
	legacyHeaders: false, 
    message: "Terlalu banyak request dari IP ini, coba lagi nanti."
});
app.use(limiter);

// Simpan io di dalam request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.send('Backend Kantin FPMIPA is Running!');
});
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

// --- SCHEDULER: Auto Cancel Orders > 10 Minutes ---
// Jalan setiap 1 menit (*)
cron.schedule('* * * * *', async () => {
    try {
        // 1. CARI DULU ID yang sudah expired (> 10 menit dan masih 'new')
        //    Kita butuh ID-nya untuk memberi tahu frontend spesifik mana yang batal.
        const [rows] = await db.execute(`
            SELECT id FROM orders 
            WHERE status = 'new' 
            AND created_at < (NOW() - INTERVAL 10 MINUTE)
        `);

        if (rows.length > 0) {
            const ids = rows.map(r => r.id);
            console.log(`🧹 Auto-cancelling orders: ${ids.join(', ')}`);

            // Siapkan placeholder (?,?,?) untuk query IN
            const placeholders = ids.map(() => '?').join(',');

            // 2. UPDATE STATUS MASSAL
            await db.execute(`
                UPDATE orders 
                SET status = 'cancelled', updated_at = NOW() 
                WHERE id IN (${placeholders})
            `, ids);

            // 3. EMIT KE SEMUA CLIENT (Customer & Kasir)
            //    Dengan mengirim 'status_updated' per ID, frontend Customer akan 
            //    mendeteksi perubahan ini dan otomatis menghapus kartu dari layar "Pesanan Saya".
            ids.forEach(id => {
                io.emit('status_updated_cleanup', { id, status: 'cancelled' });
            });
            
            // Opsional: Refresh kasir secara umum (jika diperlukan)
            io.emit('refresh_kasir'); 
        }
    } catch (error) {
        console.error('❌ Auto-cancel scheduler error:', error);
    }
});

// --- HOUSEKEEPING: Hapus Permanen Sampah Lama ---
// Jalan setiap hari jam 03:00 pagi
cron.schedule('0 3 * * *', async () => {
    try {
        // Ambil konfigurasi dari .env, default ke 90 dan 365 hari jika tidak disetting
        const RETENTION_DAYS_CANCELLED = parseInt(process.env.DATA_RETENTION_DAYS_CANCELLED) || 90; 
        const RETENTION_DAYS_COMPLETED = parseInt(process.env.DATA_RETENTION_DAYS_COMPLETED) || 365; 

        console.log(`🧹 Running Daily Cleanup...`);
        console.log(`   - Cancelled > ${RETENTION_CANCELLED} days`);
        console.log(`   - Completed > ${RETENTION_COMPLETED} days`);

        // HAPUS HANYA YANG CANCELLED (Sampah Murni)
        // Kita biarkan yang 'completed' tetap ada untuk laporan keuangan
        const [resultCancelled] = await db.execute(`
            DELETE FROM orders 
            WHERE status = 'cancelled' 
            AND created_at < (NOW() - INTERVAL ? DAY)
        `, [RETENTION_DAYS_CANCELLED]); // Gunakan prepared statement (?) agar aman
        const [resultCompleted] = await db.execute(`
            DELETE FROM orders 
            WHERE status = 'completed' 
            AND created_at < (NOW() - INTERVAL ? DAY)
        `, [RETENTION_DAYS_COMPLETED]); // Gunakan prepared statement (?) agar aman

        // OPSIONAL: Hapus yang 'completed' jika sudah SANGAT LAMA (misal 2x lipat waktu retensi)
        // Atau biarkan saja selamanya jika ingin data penjualan abadi.

        // LOGGING HASIL
        if (resultCancelled.affectedRows > 0) console.log(`✅ Deleted ${resultCancelled.affectedRows} cancelled orders.`);
        if (resultCompleted.affectedRows > 0) console.log(`✅ Deleted ${resultCompleted.affectedRows} old completed orders.`);
        if (resultCancelled.affectedRows === 0 && resultCompleted.affectedRows === 0) console.log('✨ Database is clean.');

    } catch (error) {
        console.error('❌ Daily Cleanup Error:', error);
    }
});
// --- JALANKAN SERVER ---
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
});