const { Order, Retailer, sequelize } = require('../models');

async function listOrders() {
    try {
        const orders = await Order.findAll({
            limit: 5,
            order: [['id', 'DESC']],
            include: [{ model: Retailer, as: 'retailer', attributes: ['shopName'] }]
        });

        console.log('Top 5 Recent Orders (by ID DESC):');
        orders.forEach(o => {
            console.log(`ID: ${o.id} | Status: ${o.status} | Date: ${o.createdAt} | Retailer: ${o.retailer?.shopName}`);
        });
    } catch (error) {
        console.error('Error listing orders:', error);
    } finally {
        process.exit();
    }
}

listOrders();
