const express = require('express');
const router = express.Router();
const {
    getDashboardSummary,
    getSalesTrend,
    getProductSales,
    getStockData,
    getRepPerformance,
    getEmployeeStats,
    getRepList,
    getRepHistory,
    getCollectionTrend
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/summary', protect, authorize('admin'), getDashboardSummary);
router.get('/employee-stats', protect, authorize('admin', 'driver', 'collection_agent', 'sales_rep'), getEmployeeStats);
router.get('/sales-trend', protect, authorize('admin'), getSalesTrend);
router.get('/collection-trend', protect, authorize('admin'), getCollectionTrend);
router.get('/product-sales', protect, authorize('admin'), getProductSales);
router.get('/stock', protect, authorize('admin'), getStockData);
router.get('/performance', protect, authorize('admin'), getRepPerformance);
router.get('/rep-list', protect, authorize('admin'), getRepList);
router.get('/rep-history', protect, authorize('admin'), getRepHistory);

module.exports = router;
