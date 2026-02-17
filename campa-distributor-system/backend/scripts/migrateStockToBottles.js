
const { Product, sequelize } = require('../models');
const { Op } = require('sequelize');

const migrateStock = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const products = await Product.findAll();
        let updatedCount = 0;

        for (const product of products) {
            const isSingle = product.name.toUpperCase().includes('SINGLE') || product.name.toUpperCase().includes('BOTTLE');
            const bpc = product.bottlesPerCrate || 24;

            if (!isSingle) {
                // Current stock is in Crates, convert to Bottles
                const oldStock = product.stockQuantity;
                const newStock = oldStock * bpc;

                // Only update if it seems like it hasn't been migrated (heuristic? or just do it blindly as per plan)
                // Assuming this is a one-time run on current state.

                product.stockQuantity = newStock;
                await product.save();
                console.log(`Updated ${product.name}: ${oldStock} Crates -> ${newStock} Bottles`);
                updatedCount++;
            } else {
                console.log(`Skipping ${product.name} (Already in Bottles/Single)`);
            }
        }

        console.log(`Migration completed. Updated ${updatedCount} products.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateStock();
