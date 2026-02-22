const { Invoice, Order, sequelize } = require('./models');
const { Op } = require('sequelize');

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log('Start of Today (Server Time):', today.toString());
        console.log('Start of Today (ISO):', today.toISOString());

        const totalOrdersToday = await Order.count({
            where: {
                createdAt: {
                    [Op.gte]: today
                }
            }
        });
        console.log('Orders Today Count:', totalOrdersToday);

        const totalSalesToday = await Invoice.sum('netTotal', {
            where: {
                createdAt: {
                    [Op.gte]: today
                }
            }
        });
        console.log('Sales Today Sum (Invoice.netTotal):', totalSalesToday || 0);

        // Check recent invoices to see their dates
        const recentInvoices = await Invoice.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'netTotal', 'createdAt']
        });
        console.log('Most Recent 5 Invoices:');
        recentInvoices.forEach(inv => {
            console.log(`ID: ${inv.id}, NetTotal: ${inv.netTotal}, CreatedAt: ${inv.createdAt}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

run();
