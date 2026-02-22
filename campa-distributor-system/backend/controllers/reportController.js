const { Invoice, Order, Payment, Retailer, User, CancelledOrder, Sequelize, sequelize } = require('../models');
const { Op } = Sequelize;

// @desc    Get Bill Wise Sales Report Data
// @route   GET /api/reports/bills
// @access  Private (Admin)
const getBillReportData = async (req, res) => {
    try {
        const { status, startDate, endDate, startId, endId, startBillNo, endBillNo } = req.query;
        console.log('Bill Report Payload:', { status, startDate, endDate, startId, endId, startBillNo, endBillNo });

        let invoiceData = [];
        let cancelledData = [];

        // 1. Fetch from Invoices (for non-cancelled or specific statuses)
        if (status !== 'Cancelled') {
            const invoiceWhere = {};
            const orderWhere = {};

            if (startDate && endDate) {
                // invoiceDate is DATEONLY, so direct string comparison works perfectly in Sequelize
                invoiceWhere.invoiceDate = { [Op.between]: [startDate, endDate] };
            }
            if (status) {
                orderWhere.status = status;
            }

            // ID / Bill Number Range
            if (startId && endId) {
                orderWhere.id = { [Op.between]: [startId, endId] };
            }
            if (startBillNo && endBillNo) {
                orderWhere.billNumber = { [Op.between]: [startBillNo, endBillNo] };
            }

            invoiceData = await Invoice.findAll({
                where: invoiceWhere,
                include: [
                    {
                        model: Order,
                        where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
                        required: Object.keys(orderWhere).length > 0 ? true : false,
                        include: [{ model: Retailer, as: 'retailer', attributes: ['shopName'] }]
                    }
                ],
                order: [['invoiceDate', 'ASC'], ['id', 'ASC']]
            });
        }

        // 2. Fetch from CancelledOrders if requested
        if (!status || status === 'Cancelled') {
            const cancelledWhere = {};
            if (startDate && endDate) {
                // originalCreatedAt is a timestamp, use DATE() to match calendar day
                cancelledWhere[Op.and] = [
                    sequelize.where(sequelize.fn('DATE', sequelize.col('originalCreatedAt')), { [Op.gte]: startDate }),
                    sequelize.where(sequelize.fn('DATE', sequelize.col('originalCreatedAt')), { [Op.lte]: endDate })
                ];
            }
            if (startId && endId) {
                cancelledWhere.id = { [Op.between]: [startId, endId] };
            }
            if (startBillNo && endBillNo) {
                cancelledWhere.billNumber = { [Op.between]: [startBillNo, endBillNo] };
            }

            cancelledData = await CancelledOrder.findAll({
                where: cancelledWhere,
                include: [{ model: Retailer, as: 'retailer', attributes: ['shopName'] }],
                order: [['originalCreatedAt', 'ASC'], ['id', 'ASC']]
            });
        }

        console.log(`Found ${invoiceData.length} invoices and ${cancelledData.length} cancelled orders`);
        res.json({ invoices: invoiceData, cancelled: cancelledData });
    } catch (error) {
        console.error('Report Generation Error:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

// @desc    Get Collection EntryWise Report Data
// @route   GET /api/reports/collections
// @access  Private (Admin)
const getCollectionReportData = async (req, res) => {
    try {
        const { startDate, endDate, startId, endId, startBillNo, endBillNo } = req.query;
        console.log('Collection Report Payload:', { startDate, endDate, startId, endId, startBillNo, endBillNo });

        const whereClause = {};
        const orderWhere = {};

        if (startDate && endDate) {
            // paymentDate is a timestamp, use DATE() to match calendar day
            whereClause[Op.and] = [
                sequelize.where(sequelize.fn('DATE', sequelize.col('paymentDate')), { [Op.gte]: startDate }),
                sequelize.where(sequelize.fn('DATE', sequelize.col('paymentDate')), { [Op.lte]: endDate })
            ];
        }

        if (startId && endId) {
            orderWhere.id = { [Op.between]: [startId, endId] };
        }
        if (startBillNo && endBillNo) {
            orderWhere.billNumber = { [Op.between]: [startBillNo, endBillNo] };
        }

        const collections = await Payment.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'collectedBy', attributes: ['name'] },
                {
                    model: Invoice,
                    required: (startId || endId || startBillNo || endBillNo) ? true : false,
                    include: [{
                        model: Order,
                        where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
                        required: Object.keys(orderWhere).length > 0 ? true : false,
                        attributes: ['id', 'billNumber']
                    }]
                }
            ],
            order: [['paymentDate', 'ASC'], ['id', 'ASC']]
        });

        console.log(`Found ${collections.length} collections`);
        res.json(collections);
    } catch (error) {
        console.error('Collection Report Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBillReportData,
    getCollectionReportData
};
