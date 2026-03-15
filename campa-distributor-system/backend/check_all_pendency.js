require('dotenv').config();
const { Invoice, Order } = require('./models');

async function checkAllPendency() {
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

    console.log('Order Status distribution for ALL Pending Invoices:', JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAllPendency();
