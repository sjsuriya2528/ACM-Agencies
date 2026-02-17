const { Order } = require('./models');

async function testSimpleQuery() {
    try {
        console.log('Testing simple Order.findAll()...');
        const orders = await Order.findAll({ limit: 10 });
        console.log(`Success! Found ${orders.length} orders.`);
    } catch (error) {
        console.error('Error in testSimpleQuery:', error);
    } finally {
        process.exit();
    }
}

testSimpleQuery();
