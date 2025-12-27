const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// get handler untuk mengambil semua user
router.get('/users', verifyToken, verifyAdmin, userController.getAllUser);

// post handler untuk create user
router.post('/create', verifyToken, verifyAdmin, userController.createUser);

// patch handler untuk data user
router.patch('/update/:id', verifyToken, verifyAdmin, userController.updateUser);

// delete handler untuk delete user
router.delete('/delete/:id', verifyToken, verifyAdmin, userController.deleteUser);

module.exports = router;