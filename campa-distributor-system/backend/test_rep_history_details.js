const { Invoice, Order, Retailer, OrderItem, Product, sequelize } = require('./models');
const { Op } = require('sequelize');

async function testRepHistoryDetailsV4() {
    try {
        console.log('--- Testing getRepHistory Mock Logic (V4) ---');
        
        // Just find any invoice with an order
        const sampleInvoice = await Invoice.findOne({
            include: [{
                model: Order,
                include: [{
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Product }]
                }]
            }]
        });
        
        if (!sampleInvoice) {
            console.log('No invoices found to test with.');
            return;
        }
        
        const repId = sampleInvoice.Order?.salesRepId;
        console.log(`Testing with Rep ID: ${repId}`);

        const start = '2020-01-01';
        const end = '2030-12-31';

        const invoices = await Invoice.findAll({
            include: [{
                model: Order,
                where: { salesRepId: repId },
                include: [
                    {
                        model: Retailer,
                        as: 'retailer',
                        attributes: ['id', 'shopName']
                    },
                    {
                        model: OrderItem,
                        as: 'items',
                        include: [{
                            model: Product,
                            attributes: ['id', 'name']
                        }]
                    }
                ]
            }],
            where: {
                invoiceDate: { [Op.between]: [start, end] }
            },
            order: [['invoiceDate', 'ASC']],
        });

        const dayMap = {};
        invoices.forEach(invInstance => {
            const inv = invInstance.get({ plain: true });
            let d = String(inv.invoiceDate);
            if (d.includes('T')) d = d.split('T')[0];
            
            if (!dayMap[d]) {
                dayMap[d] = { date: d, sales: 0, collections: 0, orders: 0, ordersList: [] };
            }
            
            const entry = dayMap[d];
            entry.sales += parseFloat(inv.netTotal) || 0;
            entry.orders += 1;
            entry.ordersList.push({
                invoiceNumber: String(inv.invoiceNumber),
                customerName: String(inv.customerName || inv.Order?.retailer?.shopName || 'Unknown'),
                amount: parseFloat(inv.netTotal) || 0,
                paymentStatus: String(inv.paymentStatus || 'Pending'),
                items: (inv.Order?.items || []).map(item => ({
                    name: item.Product?.name || 'Unknown Item',
                    qty: item.quantity
                }))
            });
        });

        if (Object.keys(dayMap).length > 0) {
            const firstDate = Object.keys(dayMap)[0];
            console.log(`Data for ${firstDate}:`, JSON.stringify(dayMap[firstDate], null, 2));
        }

        console.log('--- Logic Test Finished ---');
    } catch (error) {
        console.error('Error in testRepHistoryDetailsV4:', error);
    } finally {
        process.exit();
    }
}

testRepHistoryDetailsV4();
