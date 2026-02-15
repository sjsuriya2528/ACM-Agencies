const { Order, OrderItem, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper to get start of today
const getStartOfToday = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
};

// @desc    Get dashboard summary statistics
// @route   GET /api/analytics/summary
// @access  Private (Admin)
const getDashboardSummary = async (req, res) => {
    try {
        const today = getStartOfToday();

        // 1. Total Orders Today
        const totalOrdersToday = await Order.count({
            where: {
                createdAt: {
                    [Op.gte]: today
                }
            }
        });

        // 2. Total Sales Today (Sum of totalAmount for today's orders)
        // Note: Sales usually means 'Completed' or 'Approved' orders, but let's take all for now or filter by status if needed.
        // Let's assume 'Approved', 'Dispatched', 'Delivered' count as sales. 'Requested' might not.
        // For simplicity, let's just sum all valid orders created today.
        const totalSalesTodayResult = await Order.sum('totalAmount', {
            where: {
                createdAt: {
                    [Op.gte]: today
                },
                status: {
                    [Op.ne]: 'Rejected' // Exclude rejected
                }
            }
        });
        const totalSalesToday = totalSalesTodayResult || 0;

        // 3. Total Lifetime Orders
        const totalLifetimeOrders = await Order.count();

        // 4. Total Lifetime Sales
        const totalLifetimeSalesResult = await Order.sum('totalAmount', {
            where: {
                status: {
                    [Op.ne]: 'Rejected'
                }
            }
        });
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

        res.json({
            today: {
                totalOrders: totalOrdersToday,
                totalSales: totalSalesToday
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

        const salesData = await Order.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
            ],
            where: {
                createdAt: {
                    [Op.gte]: sevenDaysAgo
                },
                status: {
                    [Op.ne]: 'Rejected'
                }
            },
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
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
            // Orders Today
            const ordersToday = await Order.count({
                where: {
                    salesRepId: rep.id,
                    createdAt: { [Op.gte]: today }
                }
            });

            // Sales Today (Approved/Delivered/Dispatched/Requested - basically all valid orders)
            // Or just Approved+? Let's stick to valid orders (not Rejected)
            const salesTodayResult = await Order.sum('totalAmount', {
                where: {
                    salesRepId: rep.id,
                    createdAt: { [Op.gte]: today },
                    status: { [Op.ne]: 'Rejected' }
                }
            });
            const salesToday = salesTodayResult || 0;

            // Total Orders
            const totalOrders = await Order.count({
                where: { salesRepId: rep.id }
            });

            // Total Sales
            const totalSalesResult = await Order.sum('totalAmount', {
                where: {
                    salesRepId: rep.id,
                    status: { [Op.ne]: 'Rejected' }
                }
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

module.exports = {
    getDashboardSummary,
    getSalesTrend,
    getProductSales,
    getStockData,
    getRepPerformance
};
