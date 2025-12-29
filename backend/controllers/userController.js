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

// UPDATE USER
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role } = req.body;

        const validRoles = ['admin', 'cashier', 'kitchen'];
        if (role !== undefined && !validRoles.includes(role)) {
            return res.status(400).json({ message: "Role tidak valid!" });
        }
        if(!username){
            return res.status(400).json({ message: "Nama tidak boleh kosong!" });
        }

        if (password){
            const hashedPassword = await bcrypt.hash(password, 10);

            await db.execute("UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?", [username, hashedPassword, role, id]);
            res.status(200).json({ message: "SEMUA BERUBAH BERUBAH" });
        }else{

            await db.execute("UPDATE users SET username = ?, role = ? WHERE id = ?", [username, role, id]);
            res.status(200).json({ message: "Data user berhasil diubah!" });
        }
    } catch (error){
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// HAPUS ROLE
exports.deleteUser = async (req, res) => {
    try{
        const { id } = req.params;
        
        await db.execute("DELETE FROM users WHERE id = ?", [id]);

        res.status(200).json({ message: "User berhasil dihapus!" });
    }catch(error){
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

// AMBIL DATA SEMUA LOG
exports.getAllLog = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const offset = (page - 1) * limit;

    try{
        const [rows] = await db.query(
            "SELECT COALESCE(u.username, 'Guest') AS username, COALESCE(u.role, 'N/A') AS role, al.action, al.target_id, al.details, al.created_at FROM activity_logs AS al LEFT JOIN users AS u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT ? OFFSET ?", [limit, offset]
        );
        res.status(200).json({ data: rows });
    }catch(error){
        res.status(500).json({ message: "Gagal mengambil data log..." });
    }
}