const { sequelize, Retailer, Order, OrderItem, Invoice, Payment, Delivery } = require('../models');

const clearData = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        // Order matters due to foreign key constraints
        // 1. Child tables first
        console.log('Clearing OrderItems...');
        await OrderItem.destroy({ where: {}, truncate: true, cascade: true });

        console.log('Clearing Payments...');
        await Payment.destroy({ where: {}, truncate: true, cascade: true });

        console.log('Clearing Deliveries...');
        await Delivery.destroy({ where: {}, truncate: true, cascade: true });

        // 2. Intermediate tables
        console.log('Clearing Invoices...');
        await Invoice.destroy({ where: {}, truncate: true, cascade: true });

        console.log('Clearing Orders...');
        await Order.destroy({ where: {}, truncate: true, cascade: true });

        // 3. Parent tables (excluding Users and Products as requested)
        console.log('Clearing Retailers...');
        await Retailer.destroy({ where: {}, truncate: true, cascade: true });

        console.log('Sales Data & Retailers Cleared Successfully!');

        // Reset ID sequences? (Optional, usually handled by truncate but good to force if needed)
        // await sequelize.query("ALTER SEQUENCE \"OrderItems_id_seq\" RESTART WITH 1;");
        // ... etc (Postgres specific)

    } catch (error) {
        console.error('Error clearing data:', error);
    } finally {
        await sequelize.close();
    }
};

clearData();
