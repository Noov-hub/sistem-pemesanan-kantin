const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');

// --- POST (Create) ---
router.post('/', orderController.createOrder); // Buat Pesanan
router.get('/queue', orderController.getPublicQueue); // URL: /api/orders/queue
// --- GETTERS (Filter Khusus) ---

router.get('/', verifyToken, orderController.getAllOrders);// URL: /api/orders
router.get('/active', verifyToken, orderController.getActiveOrders);// URL: /api/orders/active
router.get('/kitchen', verifyToken, orderController.getKitchenOrders);// URL: /api/orders/kitchen
router.get('/new', verifyToken, orderController.getNewOrders);// URL: /api/orders/new
router.get('/ready', verifyToken, orderController.getReadyOrders);// URL: /api/orders/ready
router.get('/history', verifyToken, orderController.getFinishedOrders);// URL: /api/orders/history
router.put('/:id/confirm', verifyToken, orderController.confirmOrder);
// --- PUT & DELETE (By ID) ---
// Wajib ditaruh PALING BAWAH agar tidak bentrok dengan route di atas
router.put('/:id', verifyToken, orderController.updateOrderStatus);
router.delete('/:id', verifyToken, orderController.deleteOrder);

module.exports = router;