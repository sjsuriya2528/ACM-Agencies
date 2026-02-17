const { Order, Retailer, User, OrderItem, Product, Invoice } = require('./models');
const { Op } = require('sequelize');

async function testGetOrders() {
    try {
        console.log('Testing getOrders with empty whereClause (admin style)...');
        const orders = await Order.findAll({
            where: {},
            include: [
                { model: Retailer, as: 'retailer', attributes: ['id', 'shopName'] },
                { model: User, as: 'salesRep', attributes: ['id', 'name'] },
                { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name'] }] },
                { model: Invoice },
            ],
            order: [['createdAt', 'DESC']],
        });
        console.log(`Success! Found ${orders.length} orders.`);
    } catch (error) {
        console.error('Error in testGetOrders:', error);
    } finally {
        process.exit();
    }
}

testGetOrders();
