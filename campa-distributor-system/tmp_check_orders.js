const { Order, sequelize } = require('../backend/models');

async function check() {
    try {
        const orders = await Order.findAll({
            attributes: ['id', 'billNumber'],
            limit: 10,
            order: [['id', 'DESC']]
        });
        console.log('Last 10 orders:');
        orders.forEach(o => console.log(`ID: ${o.id}, BillNumber: ${o.billNumber}`));

        const nullBillCount = await Order.count({ where: { billNumber: null } });
        console.log('Total orders with NULL billNumber:', nullBillCount);

        const emptyBillCount = await Order.count({ where: { billNumber: '' } });
        console.log('Total orders with EMPTY billNumber:', emptyBillCount);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
