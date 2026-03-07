const { Product, StockAdjustment, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = async (req, res) => {
    const { name, sku, price, sellingPrice, gstPercentage, stockQuantity, groupName, bottlesPerCrate } = req.body;

    try {
        const product = await Product.create({
            name,
            sku,
            price,
            sellingPrice: sellingPrice || null,
            gstPercentage,
            stockQuantity,
            groupName,
            bottlesPerCrate
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (product) {
            product.name = req.body.name || product.name;
            product.sku = req.body.sku || product.sku;
            product.price = req.body.price || product.price;
            product.sellingPrice = req.body.sellingPrice !== undefined ? (req.body.sellingPrice || null) : product.sellingPrice;
            product.gstPercentage = req.body.gstPercentage || product.gstPercentage;
            product.stockQuantity = req.body.stockQuantity !== undefined ? req.body.stockQuantity : product.stockQuantity;
            product.groupName = req.body.groupName || product.groupName;
            product.bottlesPerCrate = req.body.bottlesPerCrate !== undefined ? req.body.bottlesPerCrate : product.bottlesPerCrate;
            product.isActive = req.body.isActive !== undefined ? req.body.isActive : product.isActive;

            const updatedProduct = await product.save();
            res.json(updatedProduct); // Return updated product
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (product) {
            await product.destroy();
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Adjust product stock manually
// @route   POST /api/products/:id/adjust-stock
// @access  Private (Admin)
const adjustStock = async (req, res) => {
    const { type, quantity, remarks } = req.body;
    const productId = req.params.id;

    if (!type || !quantity || !remarks) {
        return res.status(400).json({ message: 'Type, quantity, and remarks are required' });
    }

    if (!['Addition', 'Reduction'].includes(type)) {
        return res.status(400).json({ message: 'Invalid adjustment type' });
    }

    const t = await sequelize.transaction();

    try {
        const product = await Product.findByPk(productId, { transaction: t });

        if (!product) {
            await t.rollback();
            return res.status(404).json({ message: 'Product not found' });
        }

        // 1. Update Product Stock
        if (type === 'Addition') {
            await product.increment('stockQuantity', { by: parseInt(quantity), transaction: t });
        } else {
            if (product.stockQuantity < parseInt(quantity)) {
                await t.rollback();
                return res.status(400).json({ message: 'Insufficient stock for reduction' });
            }
            await product.decrement('stockQuantity', { by: parseInt(quantity), transaction: t });
        }

        // 2. Create StockAdjustment record
        await StockAdjustment.create({
            productId,
            type,
            quantity: parseInt(quantity),
            remarks,
            adjustedById: req.user?.id || null
        }, { transaction: t });

        await t.commit();

        // Return updated product
        const updatedProduct = await Product.findByPk(productId);
        res.json({ message: 'Stock adjusted successfully', product: updatedProduct });

    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get stock adjustment history for a product
// @route   GET /api/products/:id/stock-history
// @access  Private (Admin)
const getStockHistory = async (req, res) => {
    try {
        const history = await StockAdjustment.findAll({
            where: { productId: req.params.id },
            include: [
                { model: Product, as: 'product', attributes: ['name'] },
                { model: User, as: 'adjustedBy', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all stock adjustments with filters
// @route   GET /api/products/stock-adjustments/history
// @access  Private (Admin)
const getAllStockAdjustments = async (req, res) => {
    try {
        const { productId, type, startDate, endDate, page = 1, limit = 50 } = req.query;
        const where = {};

        if (productId) where.productId = productId;
        if (type && type !== 'All') where.type = type;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt[Op.lte] = end;
            }
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await StockAdjustment.findAndCountAll({
            where,
            include: [
                { model: Product, as: 'product', attributes: ['name'] },
                { model: User, as: 'adjustedBy', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            data: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getStockHistory,
    getAllStockAdjustments
};
