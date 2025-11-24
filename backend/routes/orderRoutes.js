const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// POST http://localhost:5000/api/orders
router.post('/', orderController.createOrder);

module.exports = router;