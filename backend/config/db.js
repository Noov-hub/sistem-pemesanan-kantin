const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',      // Default user XAMPP
    password: '',      // Default password XAMPP (kosong)
    database: 'kantin_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cek koneksi saat aplikasi jalan
db.getConnection((err, conn) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.message);
    } else {
        console.log('✅ Connected to MySQL Database');
        conn.release();
    }
});

module.exports = db.promise(); // Kita pakai mode Promise (Async/Await) agar modern