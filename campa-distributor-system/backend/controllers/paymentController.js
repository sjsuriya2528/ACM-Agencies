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

        if (paymentAmount > startBalance + 0.01) { // 0.01 buffer for float issues
            return res.status(400).json({ message: 'Payment amount exceeds balance' });
        }

        const payment = await Payment.create({
            invoiceId,
            amount: paymentAmount,
            paymentMode,
            transactionId,
            collectedById,
            retailerName: invoice.customerName // Denormalize
        });

        res.status(201).json(payment);
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

        // If link is broken, use the denormalized field
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

module.exports = {
    recordPayment,
    getPayments,
};
