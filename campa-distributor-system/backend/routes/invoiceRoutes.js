const express = require('express');
const router = express.Router();
const { getInvoices, getInvoiceById } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);

module.exports = router;
