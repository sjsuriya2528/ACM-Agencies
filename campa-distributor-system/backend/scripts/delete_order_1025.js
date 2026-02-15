
const { Order, OrderItem, sequelize } = require('../models');
require('dotenv').config();

async function deleteOrder() {
    const transaction = await sequelize.transaction();
    try {
        const orderId = 1025;

        // Delete OrderItems first
        const deletedItems = await OrderItem.destroy({
            where: { orderId: orderId },
            transaction
        });
        console.log(`Deleted ${deletedItems} OrderItems for Order #${orderId}`);

        // Delete Order
        const deletedOrder = await Order.destroy({
            where: { id: orderId },
            transaction
        });

        if (deletedOrder) {
            console.log(`Successfully deleted Order #${orderId}`);
            await transaction.commit();
        } else {
            console.log(`Order #${orderId} not found`);
            await transaction.rollback();
        }

    } catch (e) {
        console.error("Error deleting order:", e);
        await transaction.rollback();
    } finally {
        await sequelize.close();
    }
}

deleteOrder();
