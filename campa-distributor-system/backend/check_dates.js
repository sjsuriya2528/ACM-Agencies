const { Invoice, Payment, sequelize } = require('./models');

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Server Time:', new Date().toString());
        console.log('Server ISO:', new Date().toISOString());

        const latestInvoice = await Invoice.findOne({
            order: [['invoiceDate', 'DESC']],
            attributes: ['invoiceDate']
        });
        console.log('Latest Invoice Date:', latestInvoice ? latestInvoice.invoiceDate : 'None');

        const latestPayment = await Payment.findOne({
            order: [['paymentDate', 'DESC']],
            attributes: ['paymentDate']
        });
        console.log('Latest Payment Date:', latestPayment ? latestPayment.paymentDate : 'None');

        const todayUTC = new Date().toISOString().split('T')[0];
        console.log('Today UTC:', todayUTC);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

run();
