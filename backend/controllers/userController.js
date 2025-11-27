const db = require("../config/db");
const dbcrypt = require('bcrypt.js');
const jwt = require('jsonwebtoken')

// AMBIL DATA SEMUA USER
exports.getAllUser = async (req, res) => {
    try {
        const { username, passwrd, role } = req.body;

        // validasi role
        if(!['admin'].includes(role)){
            return res.status(400).json({ message: "Kamu bukan admin!"});
        }

        // ambil semua data user dengan query 
        const [rows] = await db.execute("SELECT * FROM users");
        res.status(200).json({ data: rows });
    }catch (error){
        res.status(500).json({ message: "Gagal mengambil data user.." });
    }
}

// TAMBAH USER (hanya bisa diakses oleh admin)
exports.createUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Validasi Role
        if (!['cashier', 'kitchen', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Role tidak valid!" });
        }

        // Hash Password sebelum simpan
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

// update role user
exports.updateRoleUser = async (req, res) => {
    try{
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['admin', 'cashier', 'kitchen'];
        if(!validRoles.includes(role)){
            return res.status(400).json({ message: "Role tidak valid!" });
        }

        await db.execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);

        res.status(200).json({ message: "Role berhasil diubah!" });
    }catch (error){
        res.status(500).json({ message: "Server error", error: error.message });
    }
};