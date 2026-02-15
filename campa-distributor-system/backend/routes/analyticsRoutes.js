const express = require('express');
const router = express.Router();
const {
    getDashboardSummary,
    getSalesTrend,
    getProductSales,
    getStockData,
    getRepPerformance
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/summary', protect, authorize('admin'), getDashboardSummary);
router.get('/sales-trend', protect, authorize('admin'), getSalesTrend);
router.get('/product-sales', protect, authorize('admin'), getProductSales);
router.get('/stock', protect, authorize('admin'), getStockData);
router.get('/performance', protect, authorize('admin'), getRepPerformance);

module.exports = router;
