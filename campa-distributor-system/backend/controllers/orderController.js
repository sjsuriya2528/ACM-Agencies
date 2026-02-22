const { Order, OrderItem, Product, Retailer, Invoice, User, CancelledOrder, CancelledOrderItem, sequelize } = require('../models');
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
        const processedItems = [];
        let orderTotalGross = 0;

        // 1. Process items and calculate totals
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            // Taxable price per unit: either provided (override) or from product table (default)
            const taxablePricePerUnit = item.pricePerUnit !== undefined ? Number(item.pricePerUnit) : Number(product.price);
            const quantity = Number(item.quantity);
            const gstPercentage = Number(product.gstPercentage || 18);

            const totalTaxable = taxablePricePerUnit * quantity;
            const taxAmount = totalTaxable * (gstPercentage / 100);
            const netAmount = totalTaxable + taxAmount;

            orderTotalGross += netAmount;

            processedItems.push({
                productId: item.productId,
                quantity,
                productName: product.name,
                pricePerUnit: taxablePricePerUnit,
                totalPrice: totalTaxable.toFixed(2), // Taxable Value
                taxAmount: taxAmount.toFixed(2),
                netAmount: netAmount.toFixed(2)
            });
        }

        // 2. Create Order with correct Gross Total
        const order = await Order.create({
            retailerId,
            salesRepId: req.user.id,
            totalAmount: orderTotalGross.toFixed(2),
            status: 'Requested',
            billNumber,
            remarks,
            gpsLatitude,
            gpsLongitude,
            paymentMode: paymentMode || 'Credit'
        }, { transaction: t });

        // 3. Create OrderItems
        for (const pItem of processedItems) {
            await OrderItem.create({
                ...pItem,
                orderId: order.id
            }, { transaction: t });
        }

        await t.commit();
        res.status(201).json(order);

    } catch (error) {
        await t.rollback();
        console.error('Order Creation Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin/Sales Rep)
const getOrders = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = {};

        if (req.user.role === 'sales_rep') {
            whereClause = { salesRepId: req.user.id };
        } else if (req.user.role === 'driver') {
            whereClause = {
                [Op.or]: [
                    { status: 'Approved' },
                    { driverId: req.user.id }
                ]
            };
        } else if (req.user.role === 'collection_agent') {
            whereClause = {
                status: { [Op.in]: ['Dispatched', 'Delivered'] }
            };
        }

        // Apply Date Range Filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.createdAt = {
                [Op.between]: [start, end]
            };
        } else if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            whereClause.createdAt = {
                [Op.gte]: start
            };
        } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.createdAt = {
                [Op.lte]: end
            };
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: Retailer, as: 'retailer', attributes: ['id', 'shopName'] },
                { model: User, as: 'salesRep', attributes: ['id', 'name'] },
                {
                    model: OrderItem,
                    as: 'items',
                    separate: true,
                    include: [{ model: Product, attributes: ['id', 'name', 'gstPercentage', 'hsnCode'] }]
                },
                { model: Invoice },
            ],
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
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
    const items = order.items || [];

    let subTotal = 0; // Taxable Value
    let gstTotal = 0;
    let netTotal = 0;
    let totalQuantity = 0;

    items.forEach(item => {
        subTotal += Number(item.totalPrice || 0);
        gstTotal += Number(item.taxAmount || 0);
        netTotal += Number(item.netAmount || 0);
        totalQuantity += Number(item.quantity || 0);
    });

    // Fallback for legacy data if sums are zero but header has amount
    if (netTotal === 0 && Number(order.totalAmount) > 0) {
        netTotal = Number(order.totalAmount);
        // Default back-calculation for legacy
        const taxRate = 0.40;
        subTotal = netTotal / (1 + taxRate);
        gstTotal = netTotal - subTotal;
    }

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
        totalQuantity,
        subTotal: subTotal.toFixed(2),
        cgstTotal: cgst.toFixed(2),
        sgstTotal: sgst.toFixed(2),
        gstTotal: gstTotal.toFixed(2),
        netTotal: netTotal.toFixed(2),
        paymentStatus: 'Pending',
        balanceAmount: netTotal.toFixed(2)
    };
};

// @desc    Delete order (Cancel)
// @route   DELETE /api/orders/:id
// @access  Private (Admin)
const deleteOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, as: 'items', include: [Product] }, { model: Invoice }]
        });

        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Order not found' });
        }

        // 1. Move to Cancelled Tables (Check if already exists to avoid conflict)
        const existingCancelled = await CancelledOrder.findByPk(order.id, { transaction });

        if (!existingCancelled) {
            const cancelledOrder = await CancelledOrder.create({
                id: order.id,
                retailerId: order.retailerId,
                salesRepId: order.salesRepId,
                status: order.status,
                paymentMode: order.paymentMode,
                totalAmount: order.totalAmount,
                billNumber: order.billNumber,
                remarks: order.remarks,
                gpsLatitude: order.gpsLatitude,
                gpsLongitude: order.gpsLongitude,
                originalCreatedAt: order.createdAt,
                cancelledAt: new Date()
            }, { transaction });

            for (const item of order.items) {
                await CancelledOrderItem.create({
                    cancelledOrderId: cancelledOrder.id,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    pricePerUnit: item.pricePerUnit,
                    totalPrice: item.totalPrice,
                    taxAmount: item.taxAmount,
                    netAmount: item.netAmount
                }, { transaction });
            }
        }

        // 2. Restore Stock if Approved/Dispatched/Delivered (Items were deducted)
        if (['Approved', 'Dispatched', 'Delivered'].includes(order.status)) {
            for (const item of order.items) {
                if (item.Product) {
                    await item.Product.increment('stockQuantity', { by: item.quantity, transaction });
                }
            }
        }

        // 3. Delete Dependencies
        if (order.Invoice) {
            await Invoice.destroy({ where: { id: order.Invoice.id }, transaction });
        }
        await OrderItem.destroy({ where: { orderId: order.id }, transaction });

        // 4. Delete Order
        await order.destroy({ transaction });

        // 5. Reset Sequences
        await sequelize.query(`SELECT setval('"Orders_id_seq"', COALESCE((SELECT MAX(id) FROM "Orders"), 1000));`, { transaction });
        await sequelize.query(`SELECT setval('"Invoices_id_seq"', COALESCE((SELECT MAX(id) FROM "Invoices"), 1000));`, { transaction });

        await transaction.commit();
        res.json({ message: 'Order cancelled and deleted successfully. Inventory updated.' });

    } catch (error) {
        await transaction.rollback();
        console.error('Logout - Order Deletion/Cancellation Error:', {
            message: error.message,
            stack: error.stack,
            orderId: req.params.id,
            errorObject: error
        });
        let errorMessage = error.message;
        if (error.name === 'SequelizeValidationError') {
            errorMessage = `Validation Error: ${error.errors.map(e => e.message).join(', ')}`;
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            errorMessage = `Conflict Error: This order ID might already be cancelled or a duplicate exists. (${error.message})`;
        }

        res.status(500).json({
            message: errorMessage,
            details: error.errors
        });
    }
};

// @desc    Get all cancelled orders
// @route   GET /api/orders/cancelled
// @access  Private (Admin)
const getCancelledOrders = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let whereClause = {};

        // Apply Date Range Filter Based on Cancellation Date
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.cancelledAt = {
                [Op.between]: [start, end]
            };
        } else if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            whereClause.cancelledAt = {
                [Op.gte]: start
            };
        } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.cancelledAt = {
                [Op.lte]: end
            };
        }

        const orders = await CancelledOrder.findAll({
            where: whereClause,
            include: [
                { model: Retailer, as: 'retailer', attributes: ['id', 'shopName', 'phone'] },
                { model: User, as: 'salesRep', attributes: ['id', 'name'] },
                { model: CancelledOrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'gstPercentage', 'hsnCode'] }] }
            ],
            order: [['cancelledAt', 'DESC'], ['id', 'DESC']],
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get cancelled order by ID
// @route   GET /api/orders/cancelled/:id
// @access  Private (Admin)
const getCancelledOrderById = async (req, res) => {
    try {
        const order = await CancelledOrder.findByPk(req.params.id, {
            include: [
                { model: Retailer, as: 'retailer' },
                { model: User, as: 'salesRep', attributes: ['id', 'name'] },
                { model: CancelledOrderItem, as: 'items', include: [{ model: Product }] }
            ],
        });

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Cancelled order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    assignDriver,
    deleteOrder,
    getCancelledOrders,
    getCancelledOrderById
};
