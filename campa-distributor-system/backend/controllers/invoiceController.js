const { Invoice, Order, Retailer, User } = require('../models');

// @desc    Get invoices (with optional status filter)
// @route   GET /api/invoices
// @access  Private (Admin/Collector)
const getInvoices = async (req, res) => {
    try {
        const { status } = req.query;
        let whereClause = {};

        if (status) {
            whereClause.paymentStatus = status;
        }

        const invoices = await Invoice.findAll({
            where: whereClause,
            include: [
                {
                    model: Order,
                    include: [
                        { model: Retailer, as: 'retailer', attributes: ['id', 'shopName', 'address'] },
                        { model: User, as: 'salesRep', attributes: ['name'] }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
        });

        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getInvoices,
};
