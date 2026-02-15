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

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findByPk(req.params.id, {
            include: [
                {
                    model: Order,
                    include: [
                        { model: Retailer, as: 'retailer', attributes: ['id', 'shopName', 'address', 'phone'] },
                        { model: User, as: 'salesRep', attributes: ['name'] },
                        {
                            model: require('../models').OrderItem,
                            as: 'items',
                            include: [{ model: require('../models').Product, attributes: ['name', 'price'] }]
                        }
                    ]
                }
            ]
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getInvoices,
    getInvoiceById
};
