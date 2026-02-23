const { PurchaseBill, PurchaseBillItem, Product, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Auto-generate next bill number  e.g. PB-0001
const generateBillNo = async () => {
    const last = await PurchaseBill.findOne({ order: [['id', 'DESC']] });
    const nextId = last ? last.id + 1 : 1;
    return `PB-${String(nextId).padStart(4, '0')}`;
};

// @desc  Create a new purchase bill + update stock
// @route POST /api/purchase-bills
// @access Private (admin)
const createPurchaseBill = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { billDate, invoiceNo, supplierName, items, cgstAmount, sgstAmount, roundOff, notes } = req.body;

        if (!invoiceNo || !supplierName || !items || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ message: 'invoiceNo, supplierName and at least one item are required' });
        }

        // Compute totals
        const subTotal = items.reduce((sum, i) => sum + Number(i.amount), 0);
        const cgst = Number(cgstAmount) || 0;
        const sgst = Number(sgstAmount) || 0;
        const ro = Number(roundOff) || 0;
        const netTotal = subTotal + cgst + sgst + ro;

        const billNo = await generateBillNo();

        const bill = await PurchaseBill.create({
            billNo,
            billDate: billDate || new Date().toISOString().split('T')[0],
            invoiceNo,
            supplierName,
            subTotal,
            cgstAmount: cgst,
            sgstAmount: sgst,
            roundOff: ro,
            netTotal,
            notes: notes || null,
            createdById: req.user?.id || null,
        }, { transaction: t });

        // Create items
        const billItems = await PurchaseBillItem.bulkCreate(
            items.map(item => ({
                purchaseBillId: bill.id,
                productId: item.productId || null,
                description: item.description,
                quantity: Number(item.quantity),
                rate: Number(item.rate),
                amount: Number(item.amount),
            })),
            { transaction: t }
        );

        // Update stock: quantity is in CRATES, stockQuantity is in BOTTLES
        for (const item of items) {
            if (item.productId) {
                const product = await Product.findByPk(item.productId, { attributes: ['bottlesPerCrate'] });
                const bottlesPerCrate = product?.bottlesPerCrate || 1;
                await Product.increment('stockQuantity', {
                    by: Number(item.quantity) * bottlesPerCrate,
                    where: { id: item.productId },
                    transaction: t,
                });
            }
        }

        await t.commit();

        const created = await PurchaseBill.findByPk(bill.id, {
            include: [{ model: PurchaseBillItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }] }]
        });

        res.status(201).json(created);
    } catch (error) {
        await t.rollback();
        console.error('Error creating purchase bill:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc  Get all purchase bills (summary list)
// @route GET /api/purchase-bills
// @access Private (admin)
const getAllPurchaseBills = async (req, res) => {
    try {
        const { page = 1, limit = 30, search = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const where = search ? {
            [Op.or]: [
                { supplierName: { [Op.iLike]: `%${search}%` } },
                { invoiceNo: { [Op.iLike]: `%${search}%` } },
                { billNo: { [Op.iLike]: `%${search}%` } },
            ]
        } : {};

        const { count, rows } = await PurchaseBill.findAndCountAll({
            where,
            include: [
                { model: User, as: 'createdBy', attributes: ['id', 'name'] }
            ],
            order: [['billDate', 'DESC'], ['id', 'DESC']],
            limit: Number(limit),
            offset,
        });

        res.json({ total: count, page: Number(page), bills: rows });
    } catch (error) {
        console.error('Error fetching purchase bills:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc  Get single purchase bill with all items
// @route GET /api/purchase-bills/:id
// @access Private (admin)
const getPurchaseBillById = async (req, res) => {
    try {
        const bill = await PurchaseBill.findByPk(req.params.id, {
            include: [
                {
                    model: PurchaseBillItem,
                    as: 'items',
                    include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }]
                },
                { model: User, as: 'createdBy', attributes: ['id', 'name'] }
            ]
        });

        if (!bill) return res.status(404).json({ message: 'Purchase bill not found' });
        res.json(bill);
    } catch (error) {
        console.error('Error fetching purchase bill:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc  Delete a purchase bill (reverses stock)
// @route DELETE /api/purchase-bills/:id
// @access Private (admin)
const deletePurchaseBill = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const bill = await PurchaseBill.findByPk(req.params.id, {
            include: [{ model: PurchaseBillItem, as: 'items' }]
        });

        if (!bill) {
            await t.rollback();
            return res.status(404).json({ message: 'Purchase bill not found' });
        }

        // Reverse stock: quantity is in CRATES, stockQuantity is in BOTTLES
        for (const item of bill.items) {
            if (item.productId) {
                const product = await Product.findByPk(item.productId, { attributes: ['bottlesPerCrate'] });
                const bottlesPerCrate = product?.bottlesPerCrate || 1;
                await Product.decrement('stockQuantity', {
                    by: item.quantity * bottlesPerCrate,
                    where: { id: item.productId },
                    transaction: t,
                });
            }
        }

        await PurchaseBillItem.destroy({ where: { purchaseBillId: bill.id }, transaction: t });
        await bill.destroy({ transaction: t });

        await t.commit();
        res.json({ message: 'Purchase bill deleted and stock reversed' });
    } catch (error) {
        await t.rollback();
        console.error('Error deleting purchase bill:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { createPurchaseBill, getAllPurchaseBills, getPurchaseBillById, deletePurchaseBill };
