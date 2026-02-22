const db = require('./models');

async function countAll() {
    try {
        await db.sequelize.authenticate();
        const tables = [
            'User', 'Retailer', 'Product', 'Order', 'OrderItem',
            'Invoice', 'Delivery', 'Payment',
            'CancelledOrder', 'CancelledOrderItem'
        ];

        for (const table of tables) {
            const count = await db[table].count();
            console.log(`${table}: ${count}`);
        }
    } catch (error) {
        console.error('Error counting records:', error);
    } finally {
        process.exit();
    }
}

countAll();
