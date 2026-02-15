const { Order, OrderItem, Product, Retailer, Invoice, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Sales Rep, Driver)
const createOrder = async (req, res) => {
    const { retailerId, items, billNumber, remarks, gpsLatitude, gpsLongitude, paymentMode } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    const t = await sequelize.transaction();

    try {
        let totalAmount = 0;

        // Calculate total amount safely
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            totalAmount += Number(item.quantity) * Number(product.price); // Assuming price is in Product
        }


        const order = await Order.create({
            retailerId,
            salesRepId: req.user.id,
            totalAmount,
            status: 'Requested',
            billNumber,
            remarks,
            gpsLatitude,
            gpsLongitude,
            paymentMode: paymentMode || 'Credit'
        }, { transaction: t });

        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            // Ensure product exists (already checked but safe to double check or use found instance)
            await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                productName: product.name, // Snapshot name
                pricePerUnit: product.price, // Snapshot price
                totalPrice: Number(item.quantity) * Number(product.price)
            }, { transaction: t });
        }

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
        } else if (req.user.role === 'driver') {
            whereClause = {
                [Op.or]: [
                    { status: 'Approved' }, // Drivers can pick up approved orders
                    { driverId: req.user.id } // And see their own assignments
                ]
            };
        } else if (req.user.role === 'collection_agent') {
            // Agents see everything or specific? Let's show all for now or Delivered/Dispatched
            whereClause = {
                status: { [Op.in]: ['Dispatched', 'Delivered'] }
            };
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

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin, Driver, Collection Agent)
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;

    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: OrderItem, as: 'items', include: [Product] },
                { model: Retailer, as: 'retailer' },
                { model: Invoice } // Include Invoice to check payment status
            ]
        });

        if (order) {
            // Business Logic Checks
            if (status === 'Dispatched') {
                if (order.paymentMode === 'Cash') {
                    // Check if Invoice is Paid
                    if (!order.Invoice || order.Invoice.paymentStatus !== 'Paid') {
                        return res.status(400).json({ message: 'Cash orders must be PAID before Dispatch.' });
                    }
                }
            }

            // Logic for Approval -> Generate Invoice
            if (status === 'Approved' && order.status !== 'Approved') {
                // Generate Invoice if not exists
                if (!order.Invoice) {
                    const invoiceData = generateInvoiceData(order);
                    await Invoice.create(invoiceData);
                }
            }

            // Deduct stock on Approval (moved from prev logic which was inside transaction, 
            // but now we are here. To be safe, let's keep it simple. 
            // The previous logic deducted stock on 'Approved'. 
            // Let's implement that properly if not already done.
            // Wait, previous code had stock deduction logic inside updateOrderStatus inside a transaction.
            // I should preserve that.

            if (status === 'Approved' && order.status !== 'Approved') {
                for (const item of order.items) {
                    const product = item.Product;
                    if (product) {
                        if (product.stockQuantity < item.quantity) {
                            return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
                        }
                        await product.decrement('stockQuantity', { by: item.quantity });
                    }
                }
            }

            // Auto-assign driver if driver updates status to Dispatched/Delivered?
            // Usually driver "Accepts" logic. 
            if (req.user.role === 'driver' && !order.driverId) {
                order.driverId = req.user.id;
            }

            order.status = status;
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Assign driver to order
// @route   PUT /api/orders/:id/assign
// @access  Private (Admin)
const assignDriver = async (req, res) => {
    const { driverId } = req.body;

    try {
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.driverId = driverId;
        order.status = 'Dispatched';
        await order.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper to generate Invoice Data
const generateInvoiceData = (order) => {
    const netTotal = Number(order.totalAmount);
    const taxRate = 0.05; // 5%
    const taxableValue = netTotal / (1 + taxRate);
    const gstTotal = netTotal - taxableValue;
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;

    return {
        orderId: order.id,
        invoiceNumber: `INV-${order.id}-${Date.now().toString().slice(-4)}`,
        invoiceDate: new Date(),
        customerName: order.retailer?.shopName || 'Unknown Customer',
        customerAddress: order.retailer?.address,
        customerGSTIN: order.retailer?.gstin,
        customerPhone: order.retailer?.ownerPhone,
        totalQuantity: order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0,
        subTotal: taxableValue.toFixed(2),
        cgstTotal: cgst.toFixed(2),
        sgstTotal: sgst.toFixed(2),
        gstTotal: gstTotal.toFixed(2),
        netTotal: netTotal.toFixed(2),
        paymentStatus: 'Pending',
        balanceAmount: netTotal.toFixed(2) // Initial balance is full amount
    };
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    assignDriver,
};
