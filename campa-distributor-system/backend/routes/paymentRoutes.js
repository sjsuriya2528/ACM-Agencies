const express = require('express');
const router = express.Router();
const { recordPayment, getPayments, approvePayment, rejectPayment, cancelPayment, bulkApprovePayments } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin', 'driver', 'collection_agent', 'sales_rep'), recordPayment)
    .get(protect, getPayments);

router.patch('/bulk-approve', protect, authorize('admin'), bulkApprovePayments);
router.patch('/:id/approve', protect, authorize('admin'), approvePayment);
router.patch('/:id/reject', protect, authorize('admin'), rejectPayment);
router.patch('/:id/cancel', protect, authorize('admin'), cancelPayment);

module.exports = router;
