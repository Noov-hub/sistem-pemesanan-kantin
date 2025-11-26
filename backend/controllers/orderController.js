const db = require('../config/db');

// 1. CREATE: Buat Pesanan Baru (Sudah ada, tapi ini versi lengkapnya)
exports.createOrder = async (req, res) => {
    try {
        const { customer_name, order_notes } = req.body;

        if (!customer_name || !order_notes) {
            return res.status(400).json({ message: "Nama dan Pesanan wajib diisi!" });
        }

        const [result] = await db.execute(
            "INSERT INTO orders (customer_name, order_notes, status) VALUES (?, ?, 'new')",
            [customer_name, order_notes]
        );

        const newOrder = {
            id: result.insertId,
            customer_name,
            order_notes,
            status: 'new',
            created_at: new Date()
        };

        // Emit ke Socket.io (Agar Kasir bunyi/muncul notif)
        req.io.emit('new_order', newOrder);

        res.status(201).json({ message: "Pesanan berhasil dibuat!", data: newOrder });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 2. READ: Ambil Semua Pesanan (Untuk Kasir & Dapur)
// --- 1. GET ALL (Debug / Super Admin) ---
// Mengambil SEMUA data tanpa terkecuali.
exports.getAllOrders = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM orders ORDER BY created_at DESC");
        res.status(200).json({ data: rows });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// --- 2. GET ACTIVE (Untuk Tab Utama Kasir) ---
// Mengambil semua yang SEDANG BERJALAN (New, Confirmed, Cooking, Ready).
// Mengecualikan yang sudah selesai (Completed) atau batal (Cancelled).
exports.getActiveOrders = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT * FROM orders 
            WHERE status NOT IN ('completed', 'cancelled') 
            ORDER BY created_at ASC
        `);
        res.status(200).json({ data: rows });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// --- 3. GET DAPUR (Khusus Layar Dapur) ---
// Hanya mengambil yang statusnya 'confirmed' (antrian) atau 'cooking' (sedang dimasak).
// 'New' tidak perlu (belum bayar), 'Ready' tidak perlu (sudah selesai masak).
exports.getKitchenOrders = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT * FROM orders 
            WHERE status IN ('confirmed', 'cooking') 
            ORDER BY updated_at ASC
        `);
        res.status(200).json({ data: rows });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// --- 4. GET NEW (Notifikasi Pesanan Masuk) ---
// Khusus untuk tab "Pesanan Baru" di Kasir.
exports.getNewOrders = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT * FROM orders 
            WHERE status = 'new' 
            ORDER BY created_at ASC
        `);
        res.status(200).json({ data: rows });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// --- 5. GET HISTORY (Arsip) ---
// Mengambil yang sudah selesai atau dibatalkan.
exports.getFinishedOrders = async (req, res) => {
    try {
        // Limit 100 terakhir agar tidak berat
        const [rows] = await db.execute(`
            SELECT * FROM orders 
            WHERE status IN ('completed', 'cancelled') 
            ORDER BY updated_at DESC 
            LIMIT 100
        `);
        res.status(200).json({ data: rows });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
// --- 6. GET PUBLIC QUEUE (Untuk Monitor TV / HP Customer) ---
exports.getPublicQueue = async (req, res) => {
    try {
        // UPDATE: Menambahkan 'new' ke dalam daftar status yang ditampilkan
        // Kita tetap hanya mengambil kolom penting (privasi terjaga)
        const [rows] = await db.execute(`
            SELECT id, customer_name, status, created_at 
            FROM orders 
            WHERE status IN ('new', 'confirmed', 'cooking', 'ready') 
            ORDER BY created_at ASC
        `);
        
        res.status(200).json({ data: rows });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 3. UPDATE: Ganti Status (Jantung Operasional)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;   // Ambil ID dari URL
        const { status } = req.body; // Ambil Status Baru dari Body JSON

        // Validasi Status (Sesuai ENUM database kita)
        const validStatuses = ['new', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Status tidak valid!" });
        }

        // Update Database
        await db.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

        // --- REAL-TIME MAGIC ---
        // Beritahu semua layar (Kasir & Dapur) bahwa pesanan ID sekian berubah status
        req.io.emit('status_updated', { id: parseInt(id), status });

        res.status(200).json({ message: `Status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 4. DELETE: Hapus Pesanan (Opsional / Admin)
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute("DELETE FROM orders WHERE id = ?", [id]);
        
        // Beritahu frontend untuk menghapus kartu dari layar
        req.io.emit('order_deleted', { id: parseInt(id) });

        res.status(200).json({ message: "Pesanan dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};