const db = require('../config/db');

exports.createOrder = async (req, res) => {
    try {
        // Ambil data dari Body yang dikirim APICat
        const { customer_name, order_notes } = req.body;

        // Validasi sederhana
        if (!customer_name || !order_notes) {
            return res.status(400).json({ message: "Nama dan Pesanan wajib diisi!" });
        }

        // Simpan ke Database (Status default: 'new')
        const [result] = await db.execute(
            "INSERT INTO orders (customer_name, order_notes, status) VALUES (?, ?, 'new')",
            [customer_name, order_notes]
        );

        // --- SOCKET.IO TRIGGER (Real-time) ---
        // Memberi tahu semua client (Kasir) bahwa ada pesanan baru
        req.io.emit('new_order', {
            id: result.insertId,
            customer_name,
            order_notes,
            status: 'new',
            created_at: new Date()
        });

        // Respon ke APICat
        res.status(201).json({
            message: "Pesanan berhasil dibuat!",
            orderId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};