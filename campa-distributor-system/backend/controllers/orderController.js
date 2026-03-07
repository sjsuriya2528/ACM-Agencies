const { Order, OrderItem, Product, Retailer, Invoice, User, CancelledOrder, CancelledOrderItem, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Sales Rep, Driver)
const createOrder = async (req, res) => {
    const { retailerId, items, billNumber, remarks, gpsLatitude, gpsLongitude, paymentMode, roundOff, salesRepId } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    const t = await sequelize.transaction();

    try {
        const productIds = items.map(i => i.productId);
        const products = await Product.findAll({
            where: { id: { [Op.in]: productIds } },
            transaction: t
        });

        const productMap = new Map(products.map(p => [p.id, p]));
        const processedItems = [];
        let orderTotalGross = 0;

        // 1. Process items and calculate totals
        for (const item of items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

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
                totalPrice: totalTaxable.toFixed(2),
                taxAmount: taxAmount.toFixed(2),
                netAmount: netAmount.toFixed(2),
                gstPercentage
            });
        }

        // 2. Create Order
        const order = await Order.create({
            retailerId,
            salesRepId: (req.user.role === 'admin' && salesRepId) ? salesRepId : req.user.id,
            totalAmount: (orderTotalGross + Number(roundOff || 0)).toFixed(2),
            status: (req.user.role === 'admin' && req.body.status) ? req.body.status : 'Requested',
            billNumber: billNumber || null,
            remarks,
            gpsLatitude,
            gpsLongitude,
            paymentMode: paymentMode || 'Credit',
            roundOff: roundOff || 0
        }, { transaction: t });

        // 3. Create OrderItems
        for (const pItem of processedItems) {
            await OrderItem.create({
                ...pItem,
                orderId: order.id
            }, { transaction: t });
        }

        // 4. Handle auto-payment for Cash orders if Admin creates it as Approved
        if (order.status === 'Approved' && order.paymentMode === 'Cash') {
            const { Payment, Invoice } = sequelize.models;

            // Fetch order with retailer for invoice generation
            const fullOrder = await Order.findByPk(order.id, {
                include: [
                    { model: Retailer, as: 'retailer' },
                    { model: OrderItem, as: 'items', include: [Product] }
                ],
                transaction: t
            });

            // Create Invoice
            const invoiceData = generateInvoiceData(fullOrder);
            const invoice = await Invoice.create(invoiceData, { transaction: t });

            // Create Payment
            await Payment.create({
                invoiceId: invoice.id,
                amount: invoice.netTotal,
                paymentMode: 'Cash',
                paymentDate: new Date().toISOString().split('T')[0],
                collectedById: req.user.id,
                retailerName: invoice.customerName,
                approvalStatus: 'Approved',
                approvedById: req.user.id,
                approvalNote: 'Auto-paid for Cash Order'
            }, { transaction: t });
        }

        await t.commit();
        res.status(201).json(order);

    } catch (error) {
        if (t) await t.rollback();
        console.error('Order Creation Error:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            userId: req.user?.id
        });
        res.status(500).json({
            message: error.name === 'SequelizeUniqueConstraintError'
                ? 'Constraint Error: ' + error.errors.map(e => e.message).join(', ')
                : error.message
        });
    }
};


// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin/Sales Rep)
const getOrders = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 50, search, status, paymentMode } = req.query;
        const offset = (page - 1) * limit;
        // 1. Base conditions based on user role
        const conditions = [];

        if (req.user.role === 'sales_rep') {
            conditions.push({ salesRepId: req.user.id });
        } else if (req.user.role === 'driver') {
            conditions.push({
                [Op.or]: [
                    { status: 'Approved' },
                    { driverId: req.user.id }
                ]
            });
        } else if (req.user.role === 'collection_agent') {
            conditions.push({
                status: { [Op.in]: ['Dispatched', 'Delivered'] }
            });
        }

        // 2. Status Filter
        if (status && status !== 'All') {
            if (status.includes(',')) {
                conditions.push({ status: { [Op.in]: status.split(',') } });
            } else {
                conditions.push({ status: status });
            }
        }

        // 3. Payment Mode Filter
        if (paymentMode && paymentMode !== 'All') {
            conditions.push({ paymentMode: paymentMode });
        }

        // 4. Search Filter
        if (search) {
            conditions.push({
                [Op.or]: [
                    { billNumber: { [Op.iLike]: `%${search}%` } },
                    { '$retailer.shopName$': { [Op.iLike]: `%${search}%` } },
                    { '$salesRep.name$': { [Op.iLike]: `%${search}%` } }
                ]
            });
        }

        // 5. Date Range Filter
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push({ createdAt: { [Op.between]: [start, end] } });
        } else if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            conditions.push({ createdAt: { [Op.gte]: start } });
        } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push({ createdAt: { [Op.lte]: end } });
        }

        const whereClause = conditions.length > 0 ? { [Op.and]: conditions } : {};

        console.log('[DEBUG] getOrders - User:', { id: req.user.id, role: req.user.role });
        console.log('[DEBUG] getOrders - Final WhereClause:', JSON.stringify(whereClause, null, 2));

        // 6. Final queries. To completely avoid Postgres GROUP BY issues with nested sorting/paging,
        // we use a 2-step approach: fetch all matching IDs, then paginate those IDs manually.
        let matchingIdsQuery = [];
        try {
            matchingIdsQuery = await Order.findAll({
                where: whereClause,
                include: search ? [
                    { model: Retailer, as: 'retailer', attributes: [], required: true },
                    { model: User, as: 'salesRep', attributes: [], required: true }
                ] : [],
                attributes: ['id', 'totalAmount', 'createdAt'],
                order: [['createdAt', 'DESC'], ['id', 'DESC']]
            });
        } catch (e) {
            console.error('[Error] Failed to fetch matching IDs:', e.message);
            throw e; // Reraise for standard 500 error response
        }

        const count = matchingIdsQuery.length;

        // Calculate total sum of orders for the current filters (across all pages)
        const totalSumAmount = matchingIdsQuery.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);

        // Calculate pagination slices safely
        const startIndex = parseInt(offset) || 0;
        const endIndex = startIndex + (parseInt(limit) || 50);
        const paginatedIds = matchingIdsQuery.map(o => o.id).slice(startIndex, endIndex);

        let orders = [];
        if (paginatedIds.length > 0) {
            orders = await Order.findAll({
                where: { id: paginatedIds },
                include: [
                    {
                        model: Retailer,
                        as: 'retailer',
                        attributes: ['id', 'shopName', 'address', 'phone'],
                    },
                    {
                        model: User,
                        as: 'salesRep',
                        attributes: ['id', 'name', 'phone'],
                    },
                    {
                        model: OrderItem,
                        as: 'items',
                        separate: true,
                        include: [{ model: Product, attributes: ['id', 'name', 'gstPercentage', 'hsnCode'] }]
                    },
                    { model: Invoice },
                ],
                order: [['createdAt', 'DESC'], ['id', 'DESC']]
            });
        }

        console.log('[DEBUG] getOrders - Result Count:', count, 'Rows Length:', orders.length);

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalSumAmount,
            data: orders,
            debug: { role: req.user.role }
        });
    } catch (error) {
        console.error('[CRITICAL] getOrders 500:', error);
        res.status(500).json({ message: error.stack || error.message });
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
                // Deduct stock on Approval
                // This block is intentionally separate from the invoice generation block above
                // to allow for more granular control if needed, but both execute on 'Approved' status change.
                // The original code had this structure, so preserving it.
                for (const item of order.items) {
                    const product = item.Product || await Product.findByPk(item.productId);
                    if (product) {
                        if (product.stockQuantity < item.quantity) {
                            return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
                        }
                        await product.decrement('stockQuantity', { by: item.quantity });
                    }
                }

                // Auto-payment for Cash orders
                if (order.paymentMode === 'Cash') {
                    // Check if invoice already exists
                    let invoice = await Invoice.findOne({ where: { orderId: order.id } });
                    if (!invoice) {
                        const fullOrder = await Order.findByPk(order.id, {
                            include: [
                                { model: Retailer, as: 'retailer' },
                                { model: OrderItem, as: 'items', include: [Product] }
                            ]
                        });
                        const invoiceData = generateInvoiceData(fullOrder);
                        invoice = await Invoice.create(invoiceData);
                    }

                    // Create full payment if not already paid
                    if (invoice.paymentStatus !== 'Paid') {
                        const { Payment } = sequelize.models;
                        await Payment.create({
                            invoiceId: invoice.id,
                            amount: invoice.balanceAmount,
                            paymentMode: 'Cash',
                            paymentDate: new Date().toISOString().split('T')[0],
                            collectedById: req.user.id,
                            retailerName: invoice.customerName,
                            approvalStatus: 'Approved',
                            approvedById: req.user.id,
                            approvalNote: 'Auto-paid on Order Approval'
                        });
                        // Model hooks will update invoice balance
                    }
                }
            }

            // Restore stock if cancelled from a post-approval state (stock was already deducted)
            if (status === 'Cancelled' && ['Approved', 'Dispatched', 'Delivered'].includes(order.status)) {
                for (const item of order.items) {
                    const product = item.Product || await Product.findByPk(item.productId);
                    if (product) {
                        await product.increment('stockQuantity', { by: item.quantity });
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
    let totalGST = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let totalQuantity = 0;

    // Detect if Inter-State (Inter-State if Retailer GSTIN prefix is not 33)
    // 33 is Tamil Nadu prefix
    const isInterState = order.retailer?.gstin && !order.retailer.gstin.startsWith('33');

    items.forEach(item => {
        const taxableVal = Number(item.totalPrice || 0);
        const taxVal = Number(item.taxAmount || 0);

        subTotal += taxableVal;
        totalGST += taxVal;
        totalQuantity += Number(item.quantity || 0);

        if (isInterState) {
            igstTotal += taxVal;
        } else {
            cgstTotal += taxVal / 2;
            sgstTotal += taxVal / 2;
        }
    });

    const rawNetTotal = subTotal + totalGST;
    const finalNetTotal = Math.round(rawNetTotal + Number(order.roundOff || 0));
    const roundOffAmount = finalNetTotal - rawNetTotal;

    return {
        orderId: order.id,
        invoiceNumber: `INV-${order.id}-${Date.now().toString().slice(-4)}`,
        invoiceDate: new Date(),
        customerName: order.retailer?.shopName || 'Unknown Customer',
        customerAddress: order.retailer?.address,
        customerGSTIN: order.retailer?.gstin,
        customerPhone: order.retailer?.phone,
        totalQuantity,
        subTotal: subTotal.toFixed(2),
        cgstTotal: cgstTotal.toFixed(2),
        sgstTotal: sgstTotal.toFixed(2),
        igstTotal: igstTotal.toFixed(2),
        gstTotal: totalGST.toFixed(2),
        roundOff: roundOffAmount.toFixed(2),
        netTotal: finalNetTotal.toFixed(0), // Final Payable as Interger
        paymentStatus: 'Pending',
        balanceAmount: finalNetTotal.toFixed(0)
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
                const product = item.Product || await Product.findByPk(item.productId, { transaction });
                if (product) {
                    await product.increment('stockQuantity', { by: item.quantity, transaction });
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

// @desc    Update order (before approval)
// @route   PUT /api/orders/:id
// @access  Private (Admin)
const updateOrder = async (req, res) => {
    const { retailerId, items, paymentMode, remarks, roundOff, salesRepId } = req.body;
    const orderId = req.params.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    const t = await sequelize.transaction();

    try {
        const order = await Order.findByPk(orderId, { transaction: t });

        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: 'Order not found' });
        }

        // Only requested orders can be edited
        if (order.status !== 'Requested') {
            await t.rollback();
            return res.status(400).json({ message: 'Only Requested orders can be edited' });
        }

        const processedItems = [];
        let orderTotalGross = 0;

        // 1. Process items and calculate totals
        for (const item of items) {
            const product = await Product.findByPk(item.productId, { transaction: t });
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

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
                totalPrice: totalTaxable.toFixed(2),
                taxAmount: taxAmount.toFixed(2),
                netAmount: netAmount.toFixed(2),
                gstPercentage: product.gstPercentage || 18,
                orderId: order.id
            });
        }

        // 2. Update Order
        order.retailerId = retailerId || order.retailerId;
        order.paymentMode = paymentMode || order.paymentMode;
        order.remarks = remarks !== undefined ? remarks : order.remarks;
        order.roundOff = roundOff !== undefined ? roundOff : order.roundOff;
        if (req.user.role === 'admin' && salesRepId) {
            order.salesRepId = salesRepId;
        }
        order.totalAmount = (orderTotalGross + Number(order.roundOff || 0)).toFixed(2);

        await order.save({ transaction: t });

        // 3. Update OrderItems (Delete and Recreate)
        await OrderItem.destroy({ where: { orderId: order.id }, transaction: t });

        for (const pItem of processedItems) {
            await OrderItem.create(pItem, { transaction: t });
        }

        await t.commit();

        // Fetch full order to return
        const updatedOrderRecord = await Order.findByPk(order.id, {
            include: [
                { model: Retailer, as: 'retailer' },
                { model: OrderItem, as: 'items', include: [Product] }
            ]
        });

        res.json(updatedOrderRecord);

    } catch (error) {
        await t.rollback();
        console.error('Order Update Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all cancelled orders
// @route   GET /api/orders/cancelled
// @access  Private (Admin)
const getCancelledOrders = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 50, search, paymentMode } = req.query;
        const offset = (page - 1) * limit;
        let whereClause = {};

        // 1. Base conditions (only Admin can see cancelled orders usually, but let's be role-aware)
        if (req.user.role === 'sales_rep') {
            whereClause.salesRepId = req.user.id;
        }

        // 2. Payment Mode Filter
        if (paymentMode && paymentMode !== 'All') {
            whereClause.paymentMode = paymentMode;
        }

        // 3. Search Filter
        if (search) {
            whereClause[Op.or] = [
                { billNumber: { [Op.iLike]: `%${search}%` } },
                { '$retailer.shopName$': { [Op.iLike]: `%${search}%` } },
                { '$salesRep.name$': { [Op.iLike]: `%${search}%` } }
            ];
        }

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

        const { count, rows: orders } = await CancelledOrder.findAndCountAll({
            where: whereClause,
            include: [
                { model: Retailer, as: 'retailer', attributes: ['id', 'shopName', 'phone'] },
                { model: User, as: 'salesRep', attributes: ['id', 'name'] },
                { model: CancelledOrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'gstPercentage', 'hsnCode'] }] }
            ],
            order: [['cancelledAt', 'DESC'], ['id', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true,
        });

        // Calculate total sum of cancelled orders for the current filters
        const totalSumAmount = await CancelledOrder.sum('totalAmount', {
            where: whereClause,
            include: whereClause[Op.or] ? [
                { model: Retailer, as: 'retailer' },
                { model: User, as: 'salesRep' }
            ] : []
        }) || 0;

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalSumAmount,
            data: orders
        });
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
    updateOrder,
    getCancelledOrders,
    getCancelledOrderById,
    generateInvoiceData
};
