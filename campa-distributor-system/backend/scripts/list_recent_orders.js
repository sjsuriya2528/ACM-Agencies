
const { Order, Retailer, User, sequelize } = require('../models');
require('dotenv').config();

async function listRecentOrders() {
    try {
        const orders = await Order.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                { model: Retailer, as: 'retailer', attributes: ['shopName'] },
                { model: User, as: 'salesRep', attributes: ['name'] }
            ]
        });

        console.log('Recent 5 Orders:');
        orders.forEach(o => {
            console.log(`ID: ${o.id} | Date: ${o.createdAt.toLocaleString()} | Shop: ${o.retailer?.shopName} | Total: ${o.totalAmount} | Rep: ${o.salesRep?.name}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

listRecentOrders();
