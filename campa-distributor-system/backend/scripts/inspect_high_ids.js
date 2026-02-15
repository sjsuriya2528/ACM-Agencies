
const { Order, Invoice, sequelize } = require('../models');
const { Op } = require('sequelize');
require('dotenv').config();

async function inspectHighIds() {
    try {
        console.log("Checking for Orders and Invoices with ID > 1019...");

        const orders = await Order.findAll({
            where: { id: { [Op.gt]: 1019 } },
            order: [['id', 'ASC']]
        });

        const invoices = await Invoice.findAll({
            where: { id: { [Op.gt]: 1019 } },
            order: [['id', 'ASC']]
        });

        console.log(`Found ${orders.length} Orders > 1019:`);
        orders.forEach(o => console.log(` - Order ID: ${o.id}, Total: ${o.totalAmount}, Date: ${o.createdAt}`));

        console.log(`Found ${invoices.length} Invoices > 1019:`);
        invoices.forEach(i => console.log(` - Invoice ID: ${i.id}, Order ID: ${i.orderId}, Date: ${i.createdAt}`));

    } catch (e) {
        console.error("Error inspecting IDs:", e);
    } finally {
        await sequelize.close();
    }
}

inspectHighIds();
