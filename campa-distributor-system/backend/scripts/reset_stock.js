
const { Product, sequelize } = require('../models');

async function resetStock() {
    try {
        console.log("Resetting stock for ALL products to 100...");

        // Update all products' stockQuantity to 100
        const [updatedRows] = await Product.update(
            { stockQuantity: 100 },
            { where: {} } // No where clause means update all rows
        );

        console.log(`Successfully updated stock for ${updatedRows} products.`);

    } catch (e) {
        console.error("Error resetting stock:", e);
    } finally {
        await sequelize.close();
    }
}

resetStock();
