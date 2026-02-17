const { Order, Invoice } = require('./models');

async function testInvoiceAll() {
    try {
        console.log('Testing Order.findAll({ include: [Invoice] }) for ALL...');
        const orders = await Order.findAll({
            include: [
                { model: Invoice },
            ]
        });
        console.log(`Success! Found ${orders.length} orders with invoices.`);
    } catch (error) {
        console.error('Error in testInvoiceAll:', error);
    } finally {
        process.exit();
    }
}

testInvoiceAll();
