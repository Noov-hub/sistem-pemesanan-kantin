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
            WHERE status NOT IN ('new', 'completed', 'cancelled') 
            ORDER BY confirmed_at ASC
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
        // Logika FIFO (First In First Out) berdasarkan kapan dibayar
        const [rows] = await db.execute(`
            SELECT * FROM orders 
            WHERE status IN ('confirmed', 'cooking') 
            ORDER BY confirmed_at ASC
        `);
        res.status(200).json({ data: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['new', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Status tidak valid!" });
        }

        // LOGIKA CERDAS: Pilih kolom timestamp berdasarkan status
        let query = "UPDATE orders SET status = ?, updated_at = NOW()";
        
        if (status === 'new') {
            query += ", confirmed_at = NULL";
        }else if (status === 'cooking') {
            query += ", cooking_at = NOW()";
        } else if (status === 'ready') {
            query += ", ready_at = NOW()";
        } else if (status === 'completed') {
            query += ", completed_at = NOW()";
        }
        // Note: 'confirmed' sengaja tidak ada di sini agar confirmed_at tidak berubah saat edit manual
        
        query += " WHERE id = ?";

        await db.execute(query, [status, id]);

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

// [KASIR] Konfirmasi Pembayaran (Single/Batch)
// Ini mengubah status New -> Confirmed DAN mencatat waktu antrian (confirmed_at)
exports.confirmOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        // PENTING: Kita set confirmed_at = NOW() saat pembayaran terjadi.
        // Waktu inilah yang jadi patokan antrian FIFO di dapur.
        await db.execute(`
            UPDATE orders 
            SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW() 
            WHERE id = ? AND status = 'new'
        `, [id]);

        req.io.emit('status_updated', { id, status: 'confirmed' });
        // Trigger khusus agar Dapur bunyi
        req.io.emit('new_kitchen_order'); 

        res.status(200).json({ message: "Pembayaran dikonfirmasi. Masuk antrian dapur." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// [DAPUR] Mulai Masak (Bisa Batch/Banyak sekaligus)
// Menerima body: { "ids": [101, 102, 105] }
exports.startCookingBatch = async (req, res) => {
    try {
        const { ids } = req.body; // Array ID
        if (!ids || ids.length === 0) return res.status(400).json({ message: "Tidak ada pesanan dipilih" });

        // Ubah array [1,2] menjadi string "1,2" untuk SQL IN
        // Note: Cara ini aman asalkan ids dipastikan array angka
        const placeholder = ids.map(() => '?').join(',');
        
        await db.query(`
            UPDATE orders 
            SET status = 'cooking', cooking_at = NOW(), updated_at = NOW() 
            WHERE id IN (${placeholder}) AND status = 'confirmed'
        `, ids);

        // Emit loop untuk update status di frontend
        ids.forEach(id => req.io.emit('status_updated', { id, status: 'cooking' }));

        res.status(200).json({ message: `${ids.length} pesanan mulai dimasak.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// [DAPUR] Undo Masak (Human Error Handler)
// Mengembalikan Cooking -> Confirmed
// CRITICAL LOGIC: Jangan ubah 'confirmed_at'. Biarkan waktu antrian asli.
exports.undoCooking = async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute(`
            UPDATE orders 
            SET status = 'confirmed', 
                cooking_at = NULL, -- Reset waktu masak
                updated_at = NOW() -- Log update tetap jalan

            WHERE id = ? AND status = 'cooking'
        `, [id]);

        req.io.emit('status_updated', { id, status: 'confirmed' });
        res.status(200).json({ message: "Undo berhasil. Kembali ke antrian." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};