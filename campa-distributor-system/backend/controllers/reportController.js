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
// @desc    Get Ledger Report Data for specific Retailers
// @route   POST /api/reports/ledger
// @access  Private (Admin)
const getLedgerReportData = async (req, res) => {
    try {
        const { retailerIds, startDate, endDate } = req.body;
        console.log('Ledger Report Payload:', { retailerIds, startDate, endDate });

        if (!retailerIds || !Array.isArray(retailerIds) || retailerIds.length === 0) {
            return res.status(400).json({ message: 'Please provide at least one retailerId.' });
        }

        const retailersData = [];

        for (const retailerId of retailerIds) {
            const retailer = await Retailer.findByPk(retailerId, { attributes: ['id', 'shopName', 'ownerName'] });
            if (!retailer) continue;

            const orders = await Order.findAll({
                where: { retailerId },
                attributes: ['id', 'billNumber']
            });
            const orderIds = orders.map(o => o.id);

            // Fetch Invoices (Debits)
            const invoiceWhere = { orderId: orderIds };
            if (startDate || endDate) {
                invoiceWhere.invoiceDate = {};
                if (startDate) invoiceWhere.invoiceDate[Op.gte] = startDate;
                if (endDate) invoiceWhere.invoiceDate[Op.lte] = endDate;
            }

            const invoices = await Invoice.findAll({
                where: invoiceWhere,
                attributes: ['id', 'invoiceDate', 'invoiceNumber', 'netTotal'],
                raw: true
            });
            const invoiceIds = invoices.map(i => i.id);

            // Fetch Payments (Credits)
            const paymentWhere = { invoiceId: invoiceIds, approvalStatus: 'Approved' };
            if (startDate || endDate) {
                paymentWhere[Op.and] = [];
                if (startDate) paymentWhere[Op.and].push(sequelize.where(sequelize.fn('DATE', sequelize.col('paymentDate')), { [Op.gte]: startDate }));
                if (endDate) paymentWhere[Op.and].push(sequelize.where(sequelize.fn('DATE', sequelize.col('paymentDate')), { [Op.lte]: endDate }));
            }

            const payments = await Payment.findAll({
                where: paymentWhere,
                attributes: ['id', 'paymentDate', 'amount', 'transactionId', 'paymentReference', 'invoiceId'],
                raw: true
            });

            // Calculate Opening Balance for the period (if startDate is provided)
            let openingBalance = 0;
            if (startDate) {
                const pastInvoices = await Invoice.findAll({
                    where: { orderId: orderIds, invoiceDate: { [Op.lt]: startDate } },
                    attributes: [[sequelize.fn('SUM', sequelize.col('netTotal')), 'totalDebit']],
                    raw: true
                });
                const pastPayments = await Payment.findAll({
                    where: { invoiceId: invoiceIds, approvalStatus: 'Approved', [Op.and]: [sequelize.where(sequelize.fn('DATE', sequelize.col('paymentDate')), { [Op.lt]: startDate })] },
                    attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'totalCredit']],
                    raw: true
                });

                const pastDebit = parseFloat(pastInvoices[0]?.totalDebit || 0);
                const pastCredit = parseFloat(pastPayments[0]?.totalCredit || 0);
                openingBalance = pastDebit - pastCredit;
            }

            // Combine and sort entries
            let ledgerEntries = [];

            // Generate Opening Balance Entry if applicable (or if it's start of time, just 0)
            ledgerEntries.push({
                sno: 1,
                date: startDate || '',
                billNo: '0',
                particular: 'OPENING',
                debit: openingBalance > 0 ? openingBalance : 0,
                credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
                isOpening: true,
                timestamp: startDate ? new Date(startDate).getTime() : 0 // Ensure it sorts first
            });

            // Add Invoices
            invoices.forEach(inv => {
                const order = orders.find(o => o.id === inv.orderId);
                ledgerEntries.push({
                    date: inv.invoiceDate,
                    billNo: inv.invoiceNumber || (order ? order.billNumber : ''),
                    particular: 'SALES',
                    debit: parseFloat(inv.netTotal || 0),
                    credit: 0,
                    timestamp: new Date(inv.invoiceDate).getTime()
                });
            });

            // Add Payments
            payments.forEach(pay => {
                const inv = invoices.find(i => i.id === pay.invoiceId);
                const order = inv ? orders.find(o => o.id === inv.orderId) : null;
                ledgerEntries.push({
                    date: pay.paymentDate ? pay.paymentDate.toISOString().split('T')[0] : '', // format to YYYY-MM-DD
                    billNo: pay.paymentReference || pay.transactionId || (inv ? inv.invoiceNumber : ''),
                    particular: 'COLLECTION',
                    debit: 0,
                    credit: parseFloat(pay.amount || 0),
                    timestamp: pay.paymentDate ? new Date(pay.paymentDate).getTime() : 0
                });
            });

            // Sort by timestamp
            ledgerEntries.sort((a, b) => a.timestamp - b.timestamp);

            // Re-assign SNO
            ledgerEntries.forEach((entry, idx) => {
                entry.sno = idx + 1;
            });

            // Calculate Totals
            const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
            const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);

            retailersData.push({
                retailerId: retailer.id,
                shopName: retailer.shopName,
                ownerName: retailer.ownerName,
                ledger: ledgerEntries,
                totalDebit,
                totalCredit,
                closingBalance: totalDebit - totalCredit
            });
        }

        res.json(retailersData);
    } catch (error) {
        console.error('Ledger Report Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBillReportData,
    getCollectionReportData,
    getLedgerReportData
};
