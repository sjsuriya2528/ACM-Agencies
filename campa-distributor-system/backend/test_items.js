const { Order, OrderItem, Product } = require('./models');

async function testIncludeItems() {
    try {
        console.log('Testing Order.findAll({ include: [OrderItem] })...');
        const orders = await Order.findAll({
            limit: 10,
            include: [
                { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name'] }] },
            ]
        });
        console.log(`Success! Found ${orders.length} orders with items.`);
    } catch (error) {
        console.error('Error in testIncludeItems:', error);
    } finally {
        process.exit();
    }
}

testIncludeItems();
