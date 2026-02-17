const { Invoice } = require('./models');

async function countInvoices() {
    try {
        const invoiceCount = await Invoice.count();
        console.log(`Invoices: ${invoiceCount}`);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

countInvoices();
