const express = require('express');
const router = express.Router();
const { getBillReportData, getCollectionReportData } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/bills', protect, admin, getBillReportData);
router.get('/collections', protect, admin, getCollectionReportData);

module.exports = router;
