const { Order, OrderItem, Product } = require('./models');

async function testItemsAll() {
    try {
        console.log('Testing Order.findAll({ include: [OrderItem] }) for ALL...');
        const orders = await Order.findAll({
            include: [
                { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name'] }] },
            ]
        });
        console.log(`Success! Found ${orders.length} orders with items.`);
    } catch (error) {
        console.error('Error in testItemsAll:', error);
    } finally {
        process.exit();
    }
}

testItemsAll();
