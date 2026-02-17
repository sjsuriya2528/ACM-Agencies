const { Order, OrderItem, Product, Retailer, User, Invoice } = require('./models');

async function testLargeQuery() {
    try {
        console.log('Testing Order.findAll({ limit: 100, include: [...] })...');
        const orders = await Order.findAll({
            limit: 100,
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
        console.error('Error in testLargeQuery:', error);
    } finally {
        process.exit();
    }
}

testLargeQuery();
