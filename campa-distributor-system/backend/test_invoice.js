const { Order, Invoice } = require('./models');

async function testIncludeInvoice() {
    try {
        console.log('Testing Order.findAll({ include: [Invoice] })...');
        const orders = await Order.findAll({
            limit: 10,
            include: [
                { model: Invoice },
            ]
        });
        console.log(`Success! Found ${orders.length} orders with invoices.`);
    } catch (error) {
        console.error('Error in testIncludeInvoice:', error);
    } finally {
        process.exit();
    }
}

testIncludeInvoice();
