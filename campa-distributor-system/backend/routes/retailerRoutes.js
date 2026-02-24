const express = require('express');
const router = express.Router();
const { getRetailers, getRetailerById, createRetailer, updateRetailer, deleteRetailer } = require('../controllers/retailerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getRetailers)
    .post(protect, authorize('admin', 'sales_rep', 'driver', 'collection_agent'), createRetailer);

router.route('/:id')
    .get(protect, getRetailerById)
    .put(protect, authorize('admin', 'sales_rep', 'driver', 'collection_agent'), updateRetailer)
    .delete(protect, authorize('admin'), deleteRetailer);

module.exports = router;
