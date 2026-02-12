const { Order, OrderItem, Product, Retailer, Invoice, User, sequelize } = require('../models');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Sales Rep)
const createOrder = async (req, res) => {
    const { retailerId, items, gpsLatitude, gpsLongitude } = req.body;

    if (items && items.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    const t = await sequelize.transaction();

    try {
        const order = await Order.create({
            retailerId,
            salesRepId: req.user.id,
            gpsLatitude,
            gpsLongitude,
            status: 'Requested',
            totalAmount: 0,
        }, { transaction: t });

        let totalAmount = 0;

        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                pricePerUnit: product.price,
                totalPrice: itemTotal,
            }, { transaction: t });
        }

        order.totalAmount = totalAmount;
        await order.save({ transaction: t });

        await t.commit();

        res.status(201).json(order);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin/Sales Rep)
const getOrders = async (req, res) => {
    try {
        let whereClause = {};
        if (req.user.role === 'sales_rep') {
            whereClause = { salesRepId: req.user.id };
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: Retailer, as: 'retailer', attributes: ['id', 'shopName'] },
                { model: User, as: 'salesRep', attributes: ['id', 'name'] },
                { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name'] }] },
                { model: Invoice }, // Include invoice if exists
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: Retailer, as: 'retailer' },
                { model: User, as: 'salesRep', attributes: ['id', 'name'] },
                { model: OrderItem, as: 'items', include: [{ model: Product }] },
                { model: Invoice },
            ],
        });

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status (Approve/Reject)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res) => {
    const { status } = req.body; // 'Approved', 'Rejected'

    const t = await sequelize.transaction();

    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, as: 'items' }],
        });

        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: 'Order not found' });
        }

        if (status === 'Approved' && order.status !== 'Approved') {
            // Check stock and deduct
            for (const item of order.items) {
                const product = await Product.findByPk(item.productId, { transaction: t });
                if (product.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product.name}`);
                }
                product.stockQuantity -= item.quantity;
                await product.save({ transaction: t });
            }

            // Create Invoice
            await Invoice.create({
                orderId: order.id,
                totalAmount: order.totalAmount,
                balanceAmount: order.totalAmount, // Initially full amount pending
                paymentStatus: 'Pending',
            }, { transaction: t });
        }

        order.status = status;
        await order.save({ transaction: t });

        await t.commit();
        res.json(order);
    } catch (error) {
        await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
};
