const express = require('express');
const router = express.Router();
const { assignDelivery, getDeliveries, updateDeliveryStatus } = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin', 'sales_rep'), assignDelivery)
    .get(protect, getDeliveries);

router.route('/:id/status')
    .put(protect, authorize('admin', 'driver'), updateDeliveryStatus);

module.exports = router;
