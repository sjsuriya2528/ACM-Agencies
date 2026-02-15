const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus,
    assignDriver,
    deleteOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('sales_rep', 'driver'), createOrder)
    .get(protect, getOrders);

router.route('/:id')
    .get(protect, getOrderById);

router.route('/:id/status')
    .put(protect, authorize('admin', 'driver', 'collection_agent'), updateOrderStatus);

// ... (previous routes)

router.route('/:id/assign')
    .put(protect, authorize('admin'), assignDriver);

router.route('/:id')
    .get(protect, getOrderById)
    .delete(protect, authorize('admin'), deleteOrder);

module.exports = router;
