const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// get handler untuk mengambil semua user
router.get('/admin/users', verifyToken, verifyAdmin, userController.getAllUser);

// post handler untuk create user
router.post('/admin/create', verifyToken, verifyAdmin, userController.createUser);

// patch handler untuk role user
router.patch('/admin/update-role/:id', verifyToken, verifyAdmin, userController.updateRoleUser);