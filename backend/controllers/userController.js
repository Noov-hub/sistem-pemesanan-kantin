const db = require("../config/db");
const bcrypt = require('bcryptjs'); // FIX: Typo import

// AMBIL DATA SEMUA USER
exports.getAllUser = async (req, res) => {
    try {
        // Validasi role sudah ditangani middleware verifyAdmin, jadi langsung query saja.
        // Jangan select password!
        const [rows] = await db.execute("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC");
        res.status(200).json({ data: rows });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data user.." });
    }
}

// TAMBAH USER
exports.createUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!['cashier', 'kitchen', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Role tidak valid!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            [username, hashedPassword, role]
        );

        res.status(201).json({ message: `User ${role} berhasil dibuat!` });

    } catch (error) {
        res.status(500).json({ message: "Gagal membuat user (Username mungkin kembar)" });
    }
};

// UPDATE ROLE
exports.updateRoleUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['admin', 'cashier', 'kitchen'];
        if(!validRoles.includes(role)){
            return res.status(400).json({ message: "Role tidak valid!" });
        }

        await db.execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);
        res.status(200).json({ message: "Role berhasil diubah!" });
    } catch (error){
        res.status(500).json({ message: "Server error", error: error.message });
    }
};