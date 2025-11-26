const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. LOGIN (Masuk sistem)
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Cari user di DB
        const [users] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);
        if (users.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });

        const user = users[0];

        // Cek Password (Bandingkan hash)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Password salah!" });

        // Buat Token JWT (Tiket Masuk)
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '12h' } // Token berlaku 12 jam (Shift kerja)
        );

        res.json({
            message: "Login Berhasil",
            token: token,
            role: user.role,
            username: user.username
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. REGISTER USER (Hanya bisa diakses Admin)
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