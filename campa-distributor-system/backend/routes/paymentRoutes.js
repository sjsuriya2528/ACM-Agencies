const express = require('express');
const router = express.Router();
const { recordPayment, getPayments } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin', 'driver', 'collection_agent', 'sales_rep'), recordPayment)
    .get(protect, getPayments);

module.exports = router;
