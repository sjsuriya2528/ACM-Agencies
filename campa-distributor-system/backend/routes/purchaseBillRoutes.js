const express = require('express');
const router = express.Router();
const {
    createPurchaseBill,
    getAllPurchaseBills,
    getPurchaseBillById,
    deletePurchaseBill
} = require('../controllers/purchaseBillController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin'), createPurchaseBill);
router.get('/', protect, authorize('admin'), getAllPurchaseBills);
router.get('/:id', protect, authorize('admin'), getPurchaseBillById);
router.delete('/:id', protect, authorize('admin'), deletePurchaseBill);

module.exports = router;
