const { Payment } = require('./models');

async function checkDates() {
    try {
        const payments = await Payment.findAll({
            limit: 10,
            attributes: ['id', 'paymentDate', 'createdAt'],
            order: [['id', 'DESC']]
        });
        console.log('Sample Payments (Last 10):');
        console.table(payments.map(p => ({
            id: p.id,
            paymentDate: p.paymentDate,
            createdAt: p.createdAt,
            match: p.paymentDate.getTime() === p.createdAt.getTime() ? 'YES' : 'NO'
        })));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDates();
