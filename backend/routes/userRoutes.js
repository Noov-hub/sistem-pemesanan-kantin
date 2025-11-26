const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Route PUBLIK (Siapa saja boleh akses)
router.post('/login', authController.login);

// Route PROTECTED (Harus Login & Harus Admin)
// "verifyToken" cek login dulu, baru "verifyAdmin" cek role
router.post('/create', verifyToken, verifyAdmin, authController.createUser);

module.exports = router;