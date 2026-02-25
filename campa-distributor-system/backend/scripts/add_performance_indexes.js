const { sequelize } = require('../models');

async function addIndexes() {
    console.log('--- Adding Performance Indexes ---');
    try {
        const queryInterface = sequelize.getQueryInterface();

        // 1. Payments Table
        console.log('Processing Payments indexes...');
        await queryInterface.addIndex('Payments', ['invoiceId']);
        await queryInterface.addIndex('Payments', ['collectedById']);
        await queryInterface.addIndex('Payments', ['approvalStatus']);
        await queryInterface.addIndex('Payments', ['paymentDate']);
        await queryInterface.addIndex('Payments', ['createdAt']);

        // 2. Invoices Table
        console.log('Processing Invoices indexes...');
        // orderId already indexed in model, adding retailerId and status
        await queryInterface.addIndex('Invoices', ['paymentStatus']);
        await queryInterface.addIndex('Invoices', ['createdAt']);

        // 3. Orders Table
        console.log('Processing Orders indexes...');
        await queryInterface.addIndex('Orders', ['status']);
        await queryInterface.addIndex('Orders', ['paymentMode']);

        // 4. Retailers Table
        console.log('Processing Retailers indexes...');
        await queryInterface.addIndex('Retailers', ['shopName']);

        console.log('Successfully added all indexes.');
    } catch (error) {
        console.error('Failed to add indexes:', error);
    } finally {
        process.exit();
    }
}

addIndexes();
