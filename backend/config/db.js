const mysql = require('mysql2');
const dotenv = require('dotenv');

// Membaca file .env
dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,       // Membaca dari .env
    user: process.env.DB_USER,       // Membaca dari .env
    password: process.env.DB_PASS,   // Membaca dari .env
    database: process.env.DB_NAME,   // Membaca dari .env
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cek koneksi
db.getConnection((err, conn) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err.message);
    } else {
        console.log('✅ Connected to MySQL Database');
        conn.release();
    }
});

module.exports = db.promise();