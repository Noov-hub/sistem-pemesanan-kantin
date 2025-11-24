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
exports.getAllOrders = async (req, res) => {
    try {
        // Ambil semua pesanan, urutkan dari yang terbaru
        // Tips: Nanti bisa ditambah WHERE status != 'completed' agar tidak berat
        const [rows] = await db.execute("SELECT * FROM orders ORDER BY created_at DESC");
        
        res.status(200).json({ message: "Data fetched", data: rows });
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