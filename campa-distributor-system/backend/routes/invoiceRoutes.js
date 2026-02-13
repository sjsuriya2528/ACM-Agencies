const express = require('express');
const router = express.Router();
const { getInvoices } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getInvoices);

module.exports = router;
