const { sequelize, Payment, Invoice, Order, Retailer } = require('../models');
const { Op } = require('sequelize');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Backfilling retailerName for existing payments (smart match)...');
        const payments = await Payment.findAll({
            where: { retailerName: null }
        });

        console.log(`Found ${payments.length} payments with null retailerName.`);

        let successCount = 0;
        let multipleMatchCount = 0;
        let noMatchCount = 0;

        for (const payment of payments) {
            // Try to find an invoice with the exact same amount and created around the same time
            const paymentDate = new Date(payment.paymentDate);
            const dateStr = paymentDate.toISOString().split('T')[0];

            const invoices = await Invoice.findAll({
                where: {
                    netTotal: payment.amount,
                    invoiceDate: dateStr
                },
                include: [{
                    model: Order,
                    include: [{ model: Retailer, as: 'retailer' }]
                }]
            });

            if (invoices.length === 1) {
                const shopName = invoices[0].customerName || (invoices[0].Order && invoices[0].Order.retailer ? invoices[0].Order.retailer.shopName : 'Unknown');
                await payment.update({
                    retailerName: shopName,
                    invoiceId: invoices[0].id // Also fix the link while we are at it
                });
                successCount++;
            } else if (invoices.length > 1) {
                // If multiple, just pick the first one's name but maybe don't link the ID if ambiguous
                const shopName = invoices[0].customerName || (invoices[0].Order && invoices[0].Order.retailer ? invoices[0].Order.retailer.shopName : 'Unknown');
                await payment.update({ retailerName: shopName });
                multipleMatchCount++;
            } else {
                noMatchCount++;
            }
        }

        console.log('--- BACKFILL RESULTS ---');
        console.log(`Successfully matched & linked: ${successCount}`);
        console.log(`Matched name only (multiple possibilities): ${multipleMatchCount}`);
        console.log(`Could not match: ${noMatchCount}`);

        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
