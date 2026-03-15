require('dotenv').config();
const { Invoice, Order, Payment } = require('./models');

async function checkSize() {
  try {
    const invoices = await Invoice.findAll({
      where: { paymentStatus: ['Pending', 'Partially Paid'] },
      include: [
        { model: Order, as: 'order', where: { status: 'Delivered' } },
        { model: Payment, as: 'payments' }
      ]
    });

    const json = JSON.stringify(invoices);
    console.log('Count:', invoices.length);
    console.log('Size (chars):', json.length);
    console.log('Size (MB):', (json.length / (1024 * 1024)).toFixed(2));
    
    // Check first item depth
    if (invoices.length > 0) {
      console.log('First item structure depth check...');
      const item = JSON.parse(JSON.stringify(invoices[0]));
      console.log('Keys:', Object.keys(item));
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkSize();
