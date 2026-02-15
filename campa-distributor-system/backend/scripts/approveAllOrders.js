const { sequelize, Order, Invoice, Retailer, OrderItem } = require('../models');

const approveAllOrders = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        const orders = await Order.findAll({
            include: [
                { model: Retailer, as: 'retailer' },
                { model: OrderItem, as: 'items' } // Use explicit alias from definition if needed, usually 'items' is default if associated correctly
            ]
        });

        console.log(`Found ${orders.length} orders. Processing...`);

        for (const order of orders) {

            // 1. Update Status
            order.status = 'Approved';
            await order.save();

            // 2. Check/Create Invoice
            const existingInvoice = await Invoice.findOne({ where: { orderId: order.id } });

            if (!existingInvoice) {
                // Generate Invoice Data
                const netTotal = Number(order.totalAmount);
                const taxRate = 0.05; // 5% assumption based on previous logic, adjust if needed
                const taxableValue = netTotal / (1 + taxRate);
                const gstTotal = netTotal - taxableValue;
                const cgst = gstTotal / 2;
                const sgst = gstTotal / 2;

                const invoiceData = {
                    orderId: order.id,
                    invoiceNumber: `INV-${order.id}-${Date.now().toString().slice(-4)}`,
                    invoiceDate: order.createdAt || new Date(), // Use order date for historical accuracy
                    customerName: order.retailer?.shopName || 'Unknown Customer',
                    customerAddress: order.retailer?.address,
                    customerGSTIN: order.retailer?.gstin, // Might be undefined but that's ok
                    customerPhone: order.retailer?.phone,
                    totalQuantity: 0, // Calculate below
                    subTotal: taxableValue.toFixed(2),
                    cgstTotal: cgst.toFixed(2),
                    sgstTotal: sgst.toFixed(2),
                    gstTotal: gstTotal.toFixed(2),
                    netTotal: netTotal.toFixed(2),
                    paymentStatus: order.paymentMode === 'Cash' ? 'Paid' : 'Pending', // Assume Cash orders are paid
                    balanceAmount: order.paymentMode === 'Cash' ? 0 : netTotal.toFixed(2)
                };

                // Calculate quantity if items exist
                // Note: 'items' might be accessible via order.OrderItems or order.items depending on association
                // Sequelize usually returns what we included.
                if (order.items && Array.isArray(order.items)) {
                    invoiceData.totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                } else if (order.OrderItems) {
                    invoiceData.totalQuantity = order.OrderItems.reduce((sum, item) => sum + item.quantity, 0);
                }

                await Invoice.create(invoiceData);
                // console.log(`Generated Invoice for Order #${order.id}`);
            }
        }

        console.log('All orders approved and invoices generated successfully!');

    } catch (error) {
        console.error('Error in approval script:', error);
    } finally {
        await sequelize.close();
    }
};

approveAllOrders();
