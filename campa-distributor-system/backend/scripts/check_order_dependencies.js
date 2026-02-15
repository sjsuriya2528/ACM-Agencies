
const { Invoice, Delivery, Payment, sequelize } = require('../models');
require('dotenv').config();

async function checkRelatedRecords() {
    try {
        const orderId = 1025;
        console.log(`Checking related records for Order #${orderId}...`);

        const invoice = await Invoice.findOne({ where: { orderId: orderId } });

        if (invoice) {
            console.log(`Found Invoice #${invoice.id} for Order #${orderId}`);

            const delivery = await Delivery.findOne({ where: { invoiceId: invoice.id } });
            if (delivery) {
                console.log(`- Found Delivery #${delivery.id} for Invoice #${invoice.id}`);
            } else {
                console.log(`- No Delivery found for Invoice #${invoice.id}`);
            }

            const payments = await Payment.findAll({ where: { invoiceId: invoice.id } });
            if (payments.length > 0) {
                console.log(`- Found ${payments.length} Payments for Invoice #${invoice.id}`);
            } else {
                console.log(`- No Payments found for Invoice #${invoice.id}`);
            }

        } else {
            console.log(`No Invoice found for Order #${orderId}`);
        }

    } catch (e) {
        console.error("Error checking records:", e);
    } finally {
        await sequelize.close();
    }
}

checkRelatedRecords();
