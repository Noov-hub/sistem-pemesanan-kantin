const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Route PUBLIK (Siapa saja boleh akses)
router.post('/login', authController.login);

module.exports = router;