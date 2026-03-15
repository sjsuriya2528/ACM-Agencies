require('dotenv').config();
const { Invoice, Order } = require('./models');

async function checkPendency() {
  try {
    const invoices = await Invoice.findAll({
      where: { paymentStatus: 'Pending' },
      include: [{ model: Order, as: 'order' }]
    });

    console.log('Total Pending Invoices:', invoices.length);
    const stats = invoices.reduce((acc, inv) => {
      const status = inv.order?.status || 'No Order';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('Order Status distribution for Pending Invoices:', JSON.stringify(stats, null, 2));
    
    // Sample data
    if (invoices.length > 0) {
      console.log('Sample data (first 5):');
      console.log(JSON.stringify(invoices.slice(0, 5).map(i => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        paymentStatus: i.paymentStatus,
        orderStatus: i.order?.status
      })), null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkPendency();
