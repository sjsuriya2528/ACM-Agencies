const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus,
    assignDriver,
    deleteOrder,
    updateOrder,
    getCancelledOrders,
    getCancelledOrderById
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/cancelled')
    .get(protect, authorize('admin'), getCancelledOrders);

router.route('/cancelled/:id')
    .get(protect, authorize('admin'), getCancelledOrderById);

router.route('/')
    .post(protect, createOrder)
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
    .put(protect, authorize('admin'), updateOrder)
    .delete(protect, authorize('admin'), deleteOrder);

module.exports = router;
