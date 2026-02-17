const { Order, OrderItem } = require('./models');

async function countData() {
    try {
        const orderCount = await Order.count();
        const itemCount = await OrderItem.count();
        console.log(`Orders: ${orderCount}`);
        console.log(`OrderItems: ${itemCount}`);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

countData();
