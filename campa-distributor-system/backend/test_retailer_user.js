const { Order, Retailer, User } = require('./models');

async function testRetailerUser() {
    try {
        console.log('Testing Order.findAll({ include: [Retailer, User] })...');
        const orders = await Order.findAll({
            include: [
                { model: Retailer, as: 'retailer', attributes: ['id', 'shopName'] },
                { model: User, as: 'salesRep', attributes: ['id', 'name'] },
            ]
        });
        console.log(`Success! Found ${orders.length} orders with retailers/users.`);
    } catch (error) {
        console.error('Error in testRetailerUser:', error);
    } finally {
        process.exit();
    }
}

testRetailerUser();
