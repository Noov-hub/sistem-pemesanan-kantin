const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// CREATE: POST http://localhost:5000/api/orders
router.post('/', orderController.createOrder);

// READ: GET http://localhost:5000/api/orders
router.get('/', orderController.getAllOrders);

// UPDATE: PUT http://localhost:5000/api/orders/:id
// Contoh: http://localhost:5000/api/orders/5
router.put('/:id', orderController.updateOrderStatus);

// DELETE: DELETE http://localhost:5000/api/orders/:id
router.delete('/:id', orderController.deleteOrder);

module.exports = router;