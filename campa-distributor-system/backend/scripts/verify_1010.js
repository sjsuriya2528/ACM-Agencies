
const { OrderItem, sequelize } = require('../models');
require('dotenv').config();

async function checkItem() {
    try {
        const item = await OrderItem.findOne({
            where: {
                orderId: 1010,
                productId: 29
            }
        });
        if (item) {
            console.log('Item FOUND:', item.toJSON());
        } else {
            console.log('Item NOT FOUND.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
checkItem();
