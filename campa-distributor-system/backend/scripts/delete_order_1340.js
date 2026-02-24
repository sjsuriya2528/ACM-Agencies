const { Order, OrderItem, Product, Invoice, Payment, Retailer, sequelize } = require('../models');

const deleteOrder1340 = async () => {
    const t = await sequelize.transaction();
    try {
        console.log('Starting deletion of Order 1340...');

        // 1. Fetch Order and Items for stock reversal
        const order = await Order.findByPk(1340, {
            include: [{ model: OrderItem, as: 'items' }],
            transaction: t
        });

        if (!order) {
            console.log('Order 1340 not found. Nothing to delete.');
            await t.rollback();
            return;
        }

        const retailerId = order.retailerId;

        // 2. Reverse Stock
        console.log('Reversing stock...');
        for (const item of order.items) {
            const product = await Product.findByPk(item.productId, { transaction: t });
            if (product) {
                const newStock = Number(product.stockQuantity) + Number(item.quantity);
                await product.update({ stockQuantity: newStock }, { transaction: t });
                console.log(`Product ${product.id} (${product.name}): ${product.stockQuantity - item.quantity} -> ${newStock}`);
            }
        }

        // 3. Delete Payments
        const invoice = await Invoice.findOne({ where: { orderId: 1340 }, transaction: t });
        if (invoice) {
            console.log(`Deleting payments for Invoice ${invoice.id}...`);
            await Payment.destroy({ where: { invoiceId: invoice.id }, transaction: t });

            console.log(`Deleting Invoice ${invoice.id}...`);
            await invoice.destroy({ transaction: t });
        }

        // 4. Delete Order Items
        console.log('Deleting order items...');
        await OrderItem.destroy({ where: { orderId: 1340 }, transaction: t });

        // 5. Delete Order
        console.log('Deleting order...');
        await order.destroy({ transaction: t });

        // 6. Sync Retailer Balance
        console.log(`Syncing balance for Retailer ${retailerId}...`);
        // We'll call the model method if available, otherwise manual sum
        if (Retailer.updateCreditBalance) {
            await Retailer.updateCreditBalance(retailerId, { transaction: t });
        } else {
            const outstandingAmount = await Invoice.sum('balanceAmount', {
                include: [{ model: Order, where: { retailerId } }],
                transaction: t
            }) || 0;
            await Retailer.update({ creditBalance: outstandingAmount }, { where: { id: retailerId }, transaction: t });
        }

        await t.commit();
        console.log('Order 1340 and related data deleted successfully. Stock reversed.');
    } catch (error) {
        await t.rollback();
        console.error('Error during deletion:', error);
    } finally {
        process.exit();
    }
};

deleteOrder1340();
