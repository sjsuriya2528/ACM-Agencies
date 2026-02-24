
const { Product, PurchaseBillItem, OrderItem, Order, sequelize } = require('../models');
const { Op } = require('sequelize');

async function recalculateStock() {
    try {
        console.log("--- Starting Stock Recalculation ---");

        // 1. Reset all stocks to 0
        console.log("Step 1: Resetting all product stocks to 0...");
        const products = await Product.findAll();
        for (const product of products) {
            product.stockQuantity = 0;
            await product.save();
        }

        // 2. Add stock from Purchases
        console.log("Step 2: Adding stock from all Purchase records...");
        const purchaseItems = await PurchaseBillItem.findAll({
            where: { productId: { [Op.ne]: null } }
        });

        const purchaseGroups = {};
        purchaseItems.forEach(item => {
            if (!item.productId) return;
            if (!purchaseGroups[item.productId]) purchaseGroups[item.productId] = 0;
            purchaseGroups[item.productId] += Number(item.quantity);
        });

        for (const [productId, totalQty] of Object.entries(purchaseGroups)) {
            const product = await Product.findByPk(productId);
            if (product) {
                const bottlesPerCrate = product.bottlesPerCrate || 24;
                const totalBottles = totalQty * bottlesPerCrate;
                await product.increment('stockQuantity', { by: totalBottles });
            }
        }
        console.log(`Processed ${purchaseItems.length} purchase line items across ${Object.keys(purchaseGroups).length} products.`);

        // 3. Deduct stock from Approved Sales
        console.log("Step 3: Deducting stock from Approved/Dispatched/Delivered Orders...");
        const saleItems = await OrderItem.findAll({
            include: [{
                model: Order,
                where: {
                    status: { [Op.in]: ['Approved', 'Dispatched', 'Delivered'] }
                }
            }]
        });

        const saleGroups = {};
        saleItems.forEach(item => {
            if (!item.productId) return;
            if (!saleGroups[item.productId]) saleGroups[item.productId] = 0;
            saleGroups[item.productId] += Number(item.quantity);
        });

        for (const [productId, totalQty] of Object.entries(saleGroups)) {
            const product = await Product.findByPk(productId);
            if (product) {
                await product.decrement('stockQuantity', { by: totalQty });
            }
        }
        console.log(`Processed ${saleItems.length} sale line items across ${Object.keys(saleGroups).length} products.`);

        console.log("--- Recalculation Complete ---");

        // Final summary
        const finalProducts = await Product.findAll({
            attributes: ['id', 'name', 'stockQuantity'],
            order: [['stockQuantity', 'DESC']]
        });

        console.log("\nFinal Stock Levels:");
        finalProducts.forEach(p => {
            console.log(`${p.name.padEnd(40)} : ${p.stockQuantity}`);
        });

    } catch (error) {
        console.error("Error during recalculation:", error);
    } finally {
        await sequelize.close();
    }
}

recalculateStock();
