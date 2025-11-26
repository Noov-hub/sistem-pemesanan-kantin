const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// --- POST (Create) ---
router.post('/', orderController.createOrder); // Buat Pesanan

// --- GETTERS (Filter Khusus) ---
router.get('/', orderController.getAllOrders);          // URL: /api/orders
router.get('/active', orderController.getActiveOrders); // URL: /api/orders/active
router.get('/kitchen', orderController.getKitchenOrders); // URL: /api/orders/kitchen
router.get('/new', orderController.getNewOrders);       // URL: /api/orders/new
router.get('/history', orderController.getFinishedOrders); // URL: /api/orders/history

// --- PUT & DELETE (By ID) ---
// Wajib ditaruh PALING BAWAH agar tidak bentrok dengan route di atas
router.put('/:id', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;