const { Order, OrderItem, Product, Invoice, User, Payment, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
};

// @desc    Get dashboard summary statistics
// @route   GET /api/analytics/summary
// @access  Private (Admin)
const getDashboardSummary = async (req, res) => {
    try {
        const todayStr = getTodayDateString();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
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
            where: sequelize.where(
                sequelize.fn('DATE', sequelize.col('paymentDate')),
                todayStr
            )
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

// @desc    Get Sales Analysis (Day-wise for last 7 days)
// @route   GET /api/analytics/sales-trend
// @access  Private (Admin)
const getSalesTrend = async (req, res) => {
    try {
        // Last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const salesData = await Invoice.findAll({
            attributes: [
                ['invoiceDate', 'date'],
                [sequelize.fn('SUM', sequelize.col('netTotal')), 'totalSales'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
            ],
            where: {
                invoiceDate: {
                    [Op.gte]: sevenDaysAgo.toISOString().split('T')[0]
                }
            },
            group: ['invoiceDate'],
            order: [['invoiceDate', 'ASC']]
        });

        res.json(salesData);
    } catch (error) {
        console.error('Error fetching sales trend:', error);
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

module.exports = {
    getDashboardSummary,
    getSalesTrend,
    getProductSales,
    getStockData,
    getRepPerformance,
    getEmployeeStats
};
