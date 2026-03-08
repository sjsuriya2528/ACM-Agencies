const { Payment, Invoice, User, Retailer, Order } = require('../models');

// @desc    Record a payment (submitted as Pending for non-admin, Approved for admin)
// @route   POST /api/payments
// @access  Private (Driver/Collector/Admin/SalesRep)
const recordPayment = async (req, res) => {
    const { invoiceId, amount, paymentMode, transactionId, paymentDate } = req.body;
    const collectedById = req.user.id;
    const isAdmin = req.user.role === 'admin';

    try {
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const startBalance = Number(invoice.balanceAmount);
        const paymentAmount = Number(amount);

        if (paymentAmount > startBalance + 0.01) {
            return res.status(400).json({ message: 'Payment amount exceeds balance' });
        }

        // Admin-recorded payments are immediately Approved; employees submit as Pending
        const approvalStatus = isAdmin ? 'Approved' : 'Pending';

        const payment = await Payment.create({
            invoiceId,
            amount: paymentAmount,
            paymentMode,
            transactionId,
            paymentDate: paymentDate || new Date().toISOString().split('T')[0],
            collectedById,
            retailerName: invoice.customerName,
            approvalStatus,
            approvedById: isAdmin ? req.user.id : null,
        });

        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private (Admin)
const getPayments = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, mode, search } = req.query;
        const offset = (page - 1) * limit;

        const { Op } = require('sequelize');
        const where = {};
        if (status && status !== 'All') where.approvalStatus = status;
        if (mode && mode !== 'All') where.paymentMode = mode;
        if (search) {
            where[Op.or] = [
                { retailerName: { [Op.iLike]: `%${search}%` } },
                { transactionId: { [Op.iLike]: `%${search}%` } },
                { '$collectedBy.name$': { [Op.iLike]: `%${search}%` } },
                { '$Invoice.customerName$': { [Op.iLike]: `%${search}%` } },
                { '$Invoice.Order.retailer.shopName$': { [Op.iLike]: `%${search}%` } },
            ];
        }

        const { count, rows: payments } = await Payment.findAndCountAll({
            where,
            include: [
                { model: User, as: 'collectedBy', attributes: ['id', 'name', 'role'] },
                { model: User, as: 'approvedBy', attributes: ['id', 'name'] },
                {
                    model: Invoice,
                    attributes: ['id', 'netTotal', 'balanceAmount', 'customerName'],
                    include: [{
                        model: Order,
                        attributes: ['id', 'retailerId'],
                        include: [{ model: Retailer, as: 'retailer', attributes: ['shopName'] }]
                    }]
                },
            ],
            order: [
                ['paymentDate', 'DESC'],
                ['createdAt', 'DESC'],
                ['id', 'DESC']
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        // Calculate summary stats for the current filters (across all pages)
        const totalApprovedAmount = await Payment.sum('amount', {
            where: { ...where, approvalStatus: 'Approved' },
            include: where[Op.or] ? [
                { model: User, as: 'collectedBy' },
                {
                    model: Invoice,
                    include: [{
                        model: Order,
                        include: [{ model: Retailer, as: 'retailer' }]
                    }]
                }
            ] : []
        }) || 0;

        const totalPendingCount = await Payment.count({
            where: { ...where, approvalStatus: 'Pending' },
            include: where[Op.or] ? [
                { model: User, as: 'collectedBy' },
                {
                    model: Invoice,
                    include: [{
                        model: Order,
                        include: [{ model: Retailer, as: 'retailer' }]
                    }]
                }
            ] : []
        });

        const results = payments.map(p => {
            const json = p.toJSON();
            if (!json.retailerName && json.Invoice?.Order?.retailer?.shopName) {
                json.retailerName = json.Invoice.Order.retailer.shopName;
            } else if (!json.retailerName && json.Invoice?.customerName) {
                json.retailerName = json.Invoice.customerName;
            }
            return json;
        });

        res.json({
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalApprovedAmount,
            totalPendingCount,
            data: results
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve a pending payment
// @route   PATCH /api/payments/:id/approve
// @access  Private (Admin only)
const approvePayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        if (payment.approvalStatus !== 'Pending') {
            return res.status(400).json({ message: `Payment is already ${payment.approvalStatus}` });
        }

        const body = req.body || {};
        await payment.update({
            approvalStatus: 'Approved',
            approvedById: req.user.id,
            approvalNote: body.note || null,
        });
        // Invoice.updateBalance is triggered via afterUpdate hook (changed('approvalStatus'))

        res.json({ message: 'Payment approved successfully', payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject a pending payment
// @route   PATCH /api/payments/:id/reject
// @access  Private (Admin only)
const rejectPayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        if (payment.approvalStatus !== 'Pending') {
            return res.status(400).json({ message: `Payment is already ${payment.approvalStatus}` });
        }

        const body = req.body || {};
        await payment.update({
            approvalStatus: 'Rejected',
            approvedById: req.user.id,
            approvalNote: body.note || null,
        });
        // No balance change — payment was never approved

        res.json({ message: 'Payment rejected', payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel an approved payment (reverts invoice balance)
// @route   PATCH /api/payments/:id/cancel
// @access  Private (Admin only)
const cancelPayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        if (payment.approvalStatus !== 'Approved') {
            return res.status(400).json({ message: 'Only approved payments can be cancelled' });
        }

        const body = req.body || {};
        await payment.update({
            approvalStatus: 'Rejected',
            approvalNote: body.note || 'Cancelled by admin',
        });
        // afterUpdate hook will re-calculate invoice balance, effectively reverting the payment

        res.json({ message: 'Payment cancelled and invoice balance reverted', payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk approve all pending payments
// @route   PATCH /api/payments/bulk-approve
// @access  Private (Admin only)
const bulkApprovePayments = async (req, res) => {
    try {
        // 1. Get all pending payments to know which invoices/retailers stay affected
        const pendingPayments = await Payment.findAll({
            where: { approvalStatus: 'Pending' },
            include: [{
                model: Invoice,
                include: [{ model: Order, attributes: ['retailerId'] }]
            }]
        });

        if (pendingPayments.length === 0) {
            return res.status(400).json({ message: 'No pending payments to approve' });
        }

        const invoiceIds = [...new Set(pendingPayments.map(p => p.invoiceId))];
        const retailerIds = [...new Set(pendingPayments.map(p => p.Invoice?.Order?.retailerId).filter(id => id))];

        // 2. Perform bulk update on Payments (disable individual hooks to prevent O(N^2))
        await Payment.update({
            approvalStatus: 'Approved',
            approvedById: req.user.id,
            approvalNote: 'Bulk approved by admin',
        }, {
            where: { approvalStatus: 'Pending' },
            individualHooks: false
        });

        // 3. Manually trigger balance updates ONCE per affected invoice
        console.log(`Recalculating balances for ${invoiceIds.length} invoices...`);
        for (const invoiceId of invoiceIds) {
            await Invoice.updateBalance(invoiceId);
        }

        // 4. Manually trigger credit balance updates ONCE per affected retailer
        console.log(`Recalculating credit for ${retailerIds.length} retailers...`);
        for (const retailerId of retailerIds) {
            await Retailer.updateCreditBalance(retailerId);
        }

        res.json({ message: `Successfully approved ${pendingPayments.length} payments and updated ${retailerIds.length} retailers.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPaymentReceipt = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id, {
            include: [
                { model: User, as: 'collectedBy', attributes: ['name'] },
                {
                    model: Invoice,
                    attributes: ['id', 'invoiceNumber', 'invoiceDate', 'netTotal', 'customerName', 'customerAddress'],
                    include: [{
                        model: Order,
                        attributes: ['id', 'createdAt'],
                        include: [{ model: Retailer, as: 'retailer', attributes: ['shopName', 'address'] }]
                    }]
                },
            ]
        });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    recordPayment,
    getPayments,
    approvePayment,
    rejectPayment,
    cancelPayment,
    bulkApprovePayments,
    getPaymentReceipt,
};
