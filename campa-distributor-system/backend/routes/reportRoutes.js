const express = require('express');
const router = express.Router();
const { getBillReportData, getCollectionReportData, getLedgerReportData } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/bills', protect, admin, getBillReportData);
router.get('/collections', protect, admin, getCollectionReportData);
router.post('/ledger', protect, admin, getLedgerReportData);

module.exports = router;
