const jwt = require('jsonwebtoken');

// Middleware Cek Login (Apakah punya token?)
exports.verifyToken = (req, res, next) => {
    // Token biasanya dikirim di Header: "Authorization: Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Ambil tokennya saja

    if (!token) {
        return res.status(401).json({ message: "Akses Ditolak! Harap login." });
    }

    try {
        // Verifikasi tanda tangan token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Tempelkan data user ke request
        next(); // Lanjut ke Controller
    } catch (error) {
        return res.status(403).json({ message: "Token Invalid atau Kadaluarsa." });
    }
};

// Middleware Cek Role (Apakah dia Admin?)
exports.verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Akses Ditolak! Khusus Admin." });
    }
    next();
};