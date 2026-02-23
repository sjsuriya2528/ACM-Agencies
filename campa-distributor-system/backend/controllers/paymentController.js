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
        const payments = await Payment.findAll({
            include: [
                { model: User, as: 'collectedBy', attributes: ['id', 'name', 'role'] },
                { model: User, as: 'approvedBy', attributes: ['id', 'name'] },
                {
                    model: Invoice,
                    attributes: ['id', 'netTotal', 'balanceAmount', 'customerName'],
                    include: [{
                        model: Order,
                        attributes: ['id'],
                        include: [{ model: Retailer, as: 'retailer', attributes: ['shopName'] }]
                    }]
                },
            ],
            order: [['createdAt', 'DESC']],
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

        res.json(results);
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
        const pendingCount = await Payment.count({ where: { approvalStatus: 'Pending' } });
        if (pendingCount === 0) {
            return res.status(400).json({ message: 'No pending payments to approve' });
        }

        // Update all pending payments to Approved
        // individualHooks: true ensures that Invoice.updateBalance is called for each updated payment
        await Payment.update({
            approvalStatus: 'Approved',
            approvedById: req.user.id,
            approvalNote: 'Bulk approved by admin',
        }, {
            where: { approvalStatus: 'Pending' },
            individualHooks: true
        });

        res.json({ message: `Successfully approved ${pendingCount} payments` });
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
};
