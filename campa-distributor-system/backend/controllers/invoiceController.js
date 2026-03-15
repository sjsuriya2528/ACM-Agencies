const { Invoice, Order, Retailer, User, Sequelize } = require('../models');
const { Op } = Sequelize;

// @desc    Get invoices (with optional status filter)
// @route   GET /api/invoices
// @access  Private (Admin/Collector)
const getInvoices = async (req, res) => {
    try {
        const { status, search } = req.query;
        let whereClause = {};

        if (status === 'Pending') {
            whereClause.paymentStatus = { [Op.in]: ['Pending', 'Partially Paid'] };
        } else if (status) {
            whereClause.paymentStatus = status;
        }

        if (search) {
            whereClause[Op.or] = [
                { invoiceNumber: { [Op.iLike]: `%${search}%` } },
                { customerName: { [Op.iLike]: `%${search}%` } },
                { '$order.retailer.shopName$': { [Op.iLike]: `%${search}%` } }
            ];
        }

        const invoices = await Invoice.findAll({
            where: whereClause,
            include: [
                {
                    model: Order,
                    as: 'order',
                    where: status === 'Pending' ? { status: { [Op.in]: ['Dispatched', 'Delivered'] } } : {},
                    include: [
                        { model: Retailer, as: 'retailer', attributes: ['id', 'shopName', 'address'] },
                        { model: User, as: 'salesRep', attributes: ['name'] }
                    ]
                },
                {
                    model: require('../models').Payment,
                    as: 'payments',
                    include: [{ model: User, as: 'collectedBy', attributes: ['name'] }]
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
                    as: 'order',
                    include: [
                        { model: Retailer, as: 'retailer', attributes: ['id', 'shopName', 'address', 'phone'] },
                        { model: User, as: 'salesRep', attributes: ['name'] },
                        {
                            model: require('../models').OrderItem,
                            as: 'items',
                            include: [{ model: require('../models').Product, as: 'product', attributes: ['name', 'price', 'gstPercentage', 'hsnCode'] }]
                        }
                    ]
                },
                {
                    model: require('../models').Payment,
                    as: 'payments',
                    include: [{ model: User, as: 'collectedBy', attributes: ['name'] }]
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
