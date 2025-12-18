const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// get handler untuk mengambil semua user
router.get('/users', verifyToken, verifyAdmin, userController.getAllUser);

// post handler untuk create user
router.post('/create', verifyToken, verifyAdmin, userController.createUser);

// patch handler untuk role user
router.patch('/update-role/:id', verifyToken, verifyAdmin, userController.updateRoleUser);

module.exports = router;