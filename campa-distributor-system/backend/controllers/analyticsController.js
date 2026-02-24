const { Order, OrderItem, Product, Invoice, User, Payment, Retailer, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper to get today's date in YYYY-MM-DD format (IST Timezone)
const getTodayDateString = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
};

// Helper to get start of today in IST
const getStartOfToday = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(now);

    const map = {};
    parts.forEach(p => map[p.type] = p.value);

    return new Date(`${map.year}-${map.month}-${map.day}T00:00:00+05:30`);
};

// @desc    Get dashboard summary statistics
// @route   GET /api/analytics/summary
// @access  Private (Admin)
const getDashboardSummary = async (req, res) => {
    try {
        const todayStr = getTodayDateString();
        const todayStart = getStartOfToday();

        const totalOrdersToday = await Order.count({
            where: {
                createdAt: {
                    [Op.gte]: todayStart
                }
            }
        });

        // 2. Total Sales Today (Using invoiceDate)
        const totalSalesTodayResult = await Invoice.sum('netTotal', {
            where: {
                invoiceDate: todayStr
            }
        });
        const totalSalesToday = totalSalesTodayResult || 0;

        // 3. Total Lifetime Orders
        const totalLifetimeOrders = await Order.count();

        // 4. Total Lifetime Sales (Active Bills)
        const totalLifetimeSalesResult = await Invoice.sum('netTotal');
        const totalLifetimeSales = totalLifetimeSalesResult || 0;

        // 5. Stocks Available (Low Stock Count or Total Items?)
        // Let's return total products and low stock count
        const totalProducts = await Product.count();
        const lowStockCount = await Product.count({
            where: {
                stockQuantity: {
                    [Op.lt]: 50 // Threshold for low stock, adjustable
                }
            }
        });

        // 6. Total Collection Today (Strictly today's date)
        const totalCollectionTodayResult = await Payment.sum('amount', {
            where: {
                [Op.and]: [
                    sequelize.where(
                        sequelize.fn('DATE', sequelize.col('paymentDate')),
                        todayStr
                    ),
                    { approvalStatus: { [Op.ne]: 'Rejected' } }
                ]
            }
        });
        const totalCollectionToday = totalCollectionTodayResult || 0;

        res.json({
            today: {
                totalOrders: totalOrdersToday,
                totalSales: totalSalesToday,
                totalCollection: totalCollectionToday
            },
            overall: {
                totalOrders: totalLifetimeOrders,
                totalSales: totalLifetimeSales
            },
            inventory: {
                totalProducts,
                lowStockCount
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Helper to get group by and format based on timeframe
const getTimeframeLogic = (timeframe, dateCol) => {
    let groupBy, attributes, where = {};
    const today = new Date();

    switch (timeframe) {
        case 'weekly':
            // Group by Week (Postgres: to_char YYYY-WW)
            groupBy = [sequelize.fn('to_char', sequelize.col(dateCol), 'IYYY-"W"IW')];
            attributes = [
                [sequelize.fn('to_char', sequelize.col(dateCol), 'IYYY-"W"IW'), 'date']
            ];
            break;
        case 'monthly':
            // Group by Month (Postgres: to_char YYYY-MM)
            groupBy = [sequelize.fn('to_char', sequelize.col(dateCol), 'YYYY-MM')];
            attributes = [
                [sequelize.fn('to_char', sequelize.col(dateCol), 'YYYY-MM'), 'date']
            ];
            break;
        case 'yearly':
            // Group by Year (Postgres: to_char YYYY)
            groupBy = [sequelize.fn('to_char', sequelize.col(dateCol), 'YYYY')];
            attributes = [
                [sequelize.fn('to_char', sequelize.col(dateCol), 'YYYY'), 'date']
            ];
            break;
        case 'daily':
        default:
            // Group by Date (Default Daily)
            groupBy = [sequelize.fn('DATE', sequelize.col(dateCol))];
            attributes = [
                [sequelize.fn('DATE', sequelize.col(dateCol)), 'date']
            ];
            // Last 30 days for daily (IST Aware)
            const istNowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
            const thirtyDaysAgo = new Date(istNowStr);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const y = thirtyDaysAgo.getFullYear();
            const m = String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0');
            const dVal = String(thirtyDaysAgo.getDate()).padStart(2, '0');
            where = { [Op.gte]: `${y}-${m}-${dVal}` };
            break;
    }

    return { groupBy, attributes, where };
};

// @desc    Get Sales Analysis with Timeframe support
// @route   GET /api/analytics/sales-trend?timeframe=daily|weekly|monthly|yearly
// @access  Private (Admin)
const getSalesTrend = async (req, res) => {
    try {
        const { timeframe = 'daily' } = req.query;
        const logic = getTimeframeLogic(timeframe, 'invoiceDate');

        const salesData = await Invoice.findAll({
            attributes: [
                ...logic.attributes,
                [sequelize.fn('SUM', sequelize.col('netTotal')), 'totalSales'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
            ],
            where: Object.keys(logic.where).length ? { invoiceDate: logic.where } : {},
            group: logic.groupBy,
            order: [[sequelize.col('date'), 'ASC']]
        });

        res.json(salesData);
    } catch (error) {
        console.error('Error fetching sales trend:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Collection Analysis with Timeframe support
// @route   GET /api/analytics/collection-trend?timeframe=daily|weekly|monthly|yearly
// @access  Private (Admin)
const getCollectionTrend = async (req, res) => {
    try {
        const { timeframe = 'daily' } = req.query;
        const logic = getTimeframeLogic(timeframe, 'paymentDate');

        const collectionData = await Payment.findAll({
            attributes: [
                ...logic.attributes,
                [sequelize.fn('SUM', sequelize.col('amount')), 'totalCollection'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'paymentCount']
            ],
            where: {
                approvalStatus: 'Approved',
                ...(Object.keys(logic.where).length ? { paymentDate: logic.where } : {})
            },
            group: logic.groupBy,
            order: [[sequelize.col('date'), 'ASC']]
        });

        res.json(collectionData);
    } catch (error) {
        console.error('Error fetching collection trend:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Product Sales Analysis (Group wise / Top Products)
// @route   GET /api/analytics/product-sales
// @access  Private (Admin)
const getProductSales = async (req, res) => {
    try {
        // Top 5 selling products by quantity
        const topProducts = await OrderItem.findAll({
            attributes: [
                'productId',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
                [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
            ],
            include: [{
                model: Product,
                attributes: ['name', 'sku']
            }],
            group: ['productId', 'Product.id'],
            order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
            limit: 5
        });

        res.json(topProducts);
    } catch (error) {
        console.error('Error fetching product sales:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Stock Availability
// @route   GET /api/analytics/stock
// @access  Private (Admin)
const getStockData = async (req, res) => {
    try {
        const stocks = await Product.findAll({
            attributes: ['id', 'name', 'stockQuantity'],
            order: [['stockQuantity', 'ASC']], // Show lowest stock first
            limit: 10 // Top 10 lowest stock items
        });
        res.json(stocks);
    } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Sales Rep Performance
// @route   GET /api/analytics/performance
// @access  Private (Admin)
const getRepPerformance = async (req, res) => {
    try {
        const today = getStartOfToday();

        // 1. Get all Sales Reps
        const reps = await User.findAll({
            where: { role: 'sales_rep' },
            attributes: ['id', 'name', 'email']
        });

        const performanceData = await Promise.all(reps.map(async (rep) => {
            const todayStr = getTodayDateString();
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            // Orders Today (Created)
            const ordersToday = await Order.count({
                where: {
                    salesRepId: rep.id,
                    createdAt: { [Op.gte]: todayStart }
                }
            });

            // Sales Today (Using Invoice.invoiceDate)
            const salesTodayResult = await Invoice.sum('netTotal', {
                include: [{
                    model: Order,
                    where: { salesRepId: rep.id },
                    attributes: []
                }],
                where: {
                    invoiceDate: todayStr
                }
            });
            const salesToday = salesTodayResult || 0;

            // Total Orders
            const totalOrders = await Order.count({
                where: { salesRepId: rep.id }
            });

            // Total Sales (Lifetime Invoices)
            const totalSalesResult = await Invoice.sum('netTotal', {
                include: [{
                    model: Order,
                    where: { salesRepId: rep.id },
                    attributes: []
                }]
            });
            const totalSales = totalSalesResult || 0;

            return {
                id: rep.id,
                name: rep.name,
                email: rep.email,
                ordersToday,
                salesToday,
                totalOrders,
                totalSales
            };
        }));

        // Sort by Sales Today DESC
        performanceData.sort((a, b) => b.salesToday - a.salesToday);

        res.json(performanceData);
    } catch (error) {
        console.error('Error fetching rep performance:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get stats for Employee (Driver/Collection Agent)
// @route   GET /api/analytics/employee-stats
// @access  Private (Driver/Collector)
const getEmployeeStats = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(500).json({ message: 'User not found in request' });
        }

        const { id, role } = req.user;
        const today = getStartOfToday();

        const stats = {
            role,
            today: {},
            overall: {}
        };

        if (role === 'driver') {
            stats.pending = await Order.count({ where: { status: 'Approved' } });
            stats.dispatched = await Order.count({ where: { driverId: id, status: 'Dispatched' } });
            stats.delivered = await Order.count({ where: { driverId: id, status: 'Delivered' } });
        }

        if (role === 'collection_agent' || role === 'driver') {
            // Collection stats
            const todaySum = await Payment.sum('amount', {
                where: {
                    collectedById: id,
                    approvalStatus: { [Op.ne]: 'Rejected' },
                    createdAt: { [Op.gte]: today }
                }
            });
            stats.todayCollection = todaySum || 0;

            // Pending invoices
            stats.pendingInvoices = await Invoice.count({
                where: {
                    paymentStatus: { [Op.ne]: 'Paid' }
                }
            });
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching employee performance:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get list of all reps (sales_rep, driver, collection_agent)
// @route   GET /api/analytics/rep-list
// @access  Private (Admin)
const getRepList = async (req, res) => {
    try {
        const reps = await User.findAll({
            where: {
                role: ['sales_rep', 'driver', 'collection_agent'],
                isActive: true
            },
            attributes: ['id', 'name', 'role', 'email'],
            order: [['name', 'ASC']]
        });
        res.json(reps);
    } catch (error) {
        console.error('Error fetching rep list:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get daily sales and collections history for a specific rep
// @route   GET /api/analytics/rep-history?repId=&startDate=&endDate=
// @access  Private (Admin)
const getRepHistory = async (req, res) => {
    try {
        const { repId, startDate, endDate } = req.query;
        if (!repId) return res.status(400).json({ message: 'repId is required' });

        const start = startDate || new Date().toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        // ---- Sales per day (Invoice.netTotal via Order.salesRepId) ----
        const salesRows = await Invoice.findAll({
            attributes: [
                ['invoiceDate', 'date'],
                [sequelize.fn('SUM', sequelize.col('Invoice.netTotal')), 'sales'],
                [sequelize.fn('COUNT', sequelize.col('Invoice.id')), 'orders']
            ],
            include: [{
                model: Order,
                attributes: [],
                where: { salesRepId: repId }
            }],
            where: {
                invoiceDate: { [Op.between]: [start, end] }
            },
            group: ['invoiceDate'],
            order: [['invoiceDate', 'ASC']],
            raw: true
        });

        // ---- Collections per day (Payment.amount via collectedById) ----
        const collectionRows = await Payment.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('paymentDate')), 'date'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'collections']
            ],
            where: {
                collectedById: repId,
                approvalStatus: 'Approved',
                paymentDate: {
                    [Op.between]: [
                        new Date(start + 'T00:00:00.000Z'),
                        new Date(end + 'T23:59:59.999Z')
                    ]
                }
            },
            group: [sequelize.fn('DATE', sequelize.col('paymentDate'))],
            order: [[sequelize.fn('DATE', sequelize.col('paymentDate')), 'ASC']],
            raw: true
        });

        // ---- Merge into unified day-keyed map ----
        const dayMap = {};

        salesRows.forEach(row => {
            const d = row.date;
            if (!dayMap[d]) dayMap[d] = { date: d, sales: 0, collections: 0, orders: 0 };
            dayMap[d].sales = Number(row.sales) || 0;
            dayMap[d].orders = Number(row.orders) || 0;
        });

        collectionRows.forEach(row => {
            const d = row.date;
            if (!dayMap[d]) dayMap[d] = { date: d, sales: 0, collections: 0, orders: 0 };
            dayMap[d].collections = Number(row.collections) || 0;
        });

        const result = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

        // ---- Totals ----
        const totals = result.reduce(
            (acc, row) => ({
                totalSales: acc.totalSales + row.sales,
                totalCollections: acc.totalCollections + row.collections,
                totalOrders: acc.totalOrders + row.orders
            }),
            { totalSales: 0, totalCollections: 0, totalOrders: 0 }
        );

        res.json({ rows: result, totals });
    } catch (error) {
        console.error('Error fetching rep history:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getDashboardSummary,
    getSalesTrend,
    getProductSales,
    getStockData,
    getRepPerformance,
    getEmployeeStats,
    getRepList,
    getRepHistory,
    getCollectionTrend
};
