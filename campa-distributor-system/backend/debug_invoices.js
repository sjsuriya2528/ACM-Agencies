const { Invoice, Order, Retailer, User } = require('./models');
const { sequelize } = require('./models');

async function debugInvoices() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const invoices = await Invoice.findAll({
            where: { paymentStatus: ['Pending', 'Partially Paid'] },
            include: [
                {
                    model: Order,
                    include: [
                        { model: Retailer, as: 'retailer', attributes: ['id', 'shopName'] },
                    ]
                }
            ],
            limit: 5
        });

        console.log(`Found ${invoices.length} pending invoices.`);
        invoices.forEach(inv => {
            console.log('--------------------------------------------------');
            console.log(`Invoice ID: ${inv.id}`);
            console.log(`Order ID: ${inv.orderId}`);
            console.log(`Order Object:`, inv.Order ? 'Present' : 'MISSING');
            if (inv.Order) {
                console.log(`Retailer Object:`, inv.Order.retailer ? 'Present' : 'MISSING');
                if (inv.Order.retailer) {
                    console.log(`Shop Name: ${inv.Order.retailer.shopName}`);
                }
            }
            console.log(`Raw Invoice:`, JSON.stringify(inv.toJSON(), null, 2));
        });

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

debugInvoices();
