const { Payment, Invoice, User, Retailer, Order } = require('../models');

// @desc    Record a payment
// @route   POST /api/payments
// @access  Private (Driver/Collector/Admin)
const recordPayment = async (req, res) => {
    const { invoiceId, amount, paymentMode, transactionId } = req.body;
    const collectedById = req.user.id;

    try {
        const invoice = await Invoice.findByPk(invoiceId);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const startBalance = Number(invoice.balanceAmount);
        const paymentAmount = Number(amount);

        if (paymentAmount > startBalance) {
            return res.status(400).json({ message: 'Payment amount exceeds balance' });
        }

        const t = await Invoice.sequelize.transaction();

        try {
            const payment = await Payment.create({
                invoiceId,
                amount: paymentAmount,
                paymentMode,
                transactionId,
                collectedById,
            }, { transaction: t });

            const newPaidAmount = Number(invoice.paidAmount) + paymentAmount;
            const newBalance = Number(invoice.totalAmount) - newPaidAmount;

            invoice.paidAmount = newPaidAmount;
            invoice.balanceAmount = newBalance;

            if (newBalance <= 0) {
                invoice.paymentStatus = 'Paid';
            } else if (newPaidAmount > 0) {
                invoice.paymentStatus = 'Partially Paid';
            }

            await invoice.save({ transaction: t });

            await t.commit();
            res.status(201).json(payment);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get payments
// @route   GET /api/payments
// @access  Private (Admin)
const getPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            include: [
                { model: User, as: 'collectedBy', attributes: ['id', 'name'] },
                {
                    model: Invoice,
                    attributes: ['id', 'totalAmount', 'balanceAmount'],
                    include: [{
                        model: Order,
                        attributes: ['id'],
                        include: [{ model: Retailer, as: 'retailer', attributes: ['shopName'] }]
                    }]
                },
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    recordPayment,
    getPayments,
};
