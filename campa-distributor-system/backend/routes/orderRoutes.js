const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('sales_rep'), createOrder)
    .get(protect, getOrders);

router.route('/:id')
    .get(protect, getOrderById);

router.route('/:id/status')
    .put(protect, authorize('admin'), updateOrderStatus);

module.exports = router;
