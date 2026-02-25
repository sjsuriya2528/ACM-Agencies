const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../models');

const CSV_DIR = path.join(__dirname, '../../csv');

const importCsv = (filePath, rowProcessor) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const processed = rowProcessor(data);
                if (processed) {
                    results.push(processed);
                }
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

const parseBool = (str) => {
    if (!str) return false;
    return str.toLowerCase() === 'true';
};

const parseNullableInt = (str) => {
    if (!str || str.trim() === '') return null;
    const val = parseInt(str, 10);
    return isNaN(val) ? null : val;
};

const parseNullableFloat = (str) => {
    if (!str || str.trim() === '') return null;
    const val = parseFloat(str);
    return isNaN(val) ? null : val;
};

const parseNullableString = (str) => {
    if (!str || str.trim() === '') return null;
    return str.trim();
};

const parseDate = (str) => {
    if (!str || str.trim() === '') return null;
    // Format: 20/01/2026 11:32 PM (as seen in Updated_Payements.csv)
    if (str.includes('/')) {
        const [datePart, timePart, ampm] = str.split(' ');
        const [day, month, year] = datePart.split('/');
        let [hours, minutes] = timePart.split(':');

        hours = parseInt(hours);
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;

        return new Date(Date.UTC(year, month - 1, day, hours, minutes));
    }
    // Standard ISO format
    return new Date(str);
};

const parseDateOnly = (str) => {
    if (!str || str.trim() === '') return null;
    if (str.includes('/')) {
        const [datePart] = str.split(' ');
        const [day, month, year] = datePart.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return str.split('T')[0];
};

const processRetailer = (row) => ({
    id: parseInt(row.id),
    shopName: row.shopName,
    ownerName: parseNullableString(row.ownerName),
    phone: parseNullableString(row.phone),
    address: parseNullableString(row.address),
    gstin: parseNullableString(row.gstin),
    gpsLatitude: parseNullableFloat(row.gpsLatitude),
    gpsLongitude: parseNullableFloat(row.gpsLongitude),
    creditBalance: parseNullableFloat(row.creditBalance) || 0.0,
    isActive: parseBool(row.isActive),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
    externalId: parseNullableString(row.externalId),
    routeName: parseNullableString(row.routeName)
});

const processOrder = (row) => ({
    id: parseInt(row.id),
    status: row.status,
    totalAmount: parseNullableFloat(row.totalAmount) || 0.0,
    gpsLatitude: parseNullableFloat(row.gpsLatitude),
    gpsLongitude: parseNullableFloat(row.gpsLongitude),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
    salesRepId: parseNullableInt(row.salesRepId),
    retailerId: parseNullableInt(row.retailerId),
    driverId: parseNullableInt(row.driverId),
    billNumber: parseNullableString(row.billNumber),
    discountAmount: parseNullableFloat(row.discountAmount) || 0.0,
    remarks: row.remarks,
    paymentMode: row.paymentMode
});

const processOrderItem = (row) => ({
    id: parseInt(row.id),
    quantity: parseInt(row.quantity),
    pricePerUnit: parseNullableFloat(row.pricePerUnit),
    totalPrice: parseNullableFloat(row.totalPrice),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
    orderId: parseNullableInt(row.orderId),
    productId: parseNullableInt(row.productId),
    gstPercentage: parseNullableFloat(row.gstPercentage) || 18,
    taxAmount: parseNullableFloat(row.taxAmount),
    netAmount: parseNullableFloat(row.netAmount),
    productName: row.productName
});

const processCancelledOrder = (row) => ({
    id: parseInt(row.id),
    retailerId: parseNullableInt(row.retailerId),
    salesRepId: parseNullableInt(row.salesRepId) || 1,
    status: row.status,
    paymentMode: row.paymentMode,
    totalAmount: parseNullableFloat(row.totalAmount),
    billNumber: parseNullableString(row.billNumber),
    remarks: row.remarks,
    gpsLatitude: parseNullableFloat(row.gpsLatitude),
    gpsLongitude: parseNullableFloat(row.gpsLongitude),
    originalCreatedAt: parseDate(row.originalCreatedAt),
    cancelledAt: parseDate(row.cancelledAt),
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt)
});

const processInvoice = (row) => ({
    id: parseInt(row.id),
    paidAmount: parseNullableFloat(row.paidAmount) || 0.0,
    balanceAmount: parseNullableFloat(row.balanceAmount),
    paymentStatus: row.paymentStatus,
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
    orderId: parseNullableInt(row.orderId),
    invoiceDate: parseDateOnly(row.invoiceDate),
    invoiceNumber: parseNullableString(row.invoiceNumber),
    customerName: row.customerName,
    customerAddress: row.customerAddress,
    customerGSTIN: row.customerGSTIN,
    customerPhone: row.customerPhone,
    totalQuantity: parseNullableInt(row.totalQuantity),
    subTotal: parseNullableFloat(row.subTotal),
    cgstTotal: parseNullableFloat(row.cgstTotal),
    sgstTotal: parseNullableFloat(row.sgstTotal),
    igstTotal: parseNullableFloat(row.igstTotal),
    gstTotal: parseNullableFloat(row.gstTotal),
    discount: parseNullableFloat(row.discount),
    roundOff: parseNullableFloat(row.roundOff),
    netTotal: parseNullableFloat(row.netTotal),
    paymentDetails: row.paymentDetails
});

const processPayment = (row) => ({
    id: parseInt(row.id),
    amount: parseFloat(row.amount),
    paymentMode: row.paymentMode,
    transactionId: row.transactionId,
    paymentDate: parseDateOnly(row.paymentDate),
    invoiceId: parseNullableInt(row.invoiceId),
    collectedById: parseNullableInt(row.collectedById),
    retailerName: row.retailerName
});

const run = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Database connected.');

        // 0. Load helper maps
        const products = await db.Product.findAll();
        const productNameMap = {};
        products.forEach(p => {
            productNameMap[p.name.trim().toLowerCase()] = p.id;
        });
        const productIds = new Set(products.map(p => p.id));

        const users = await db.User.findAll();
        const userIds = new Set(users.map(u => u.id));

        const processCancelledOrderItem = (row) => {
            let productId = parseNullableInt(row.productId);
            if (!productId && row.productName) {
                const cleanName = row.productName.split(' (')[0].split(' CASE')[0].split(' SINGLE')[0].trim().toLowerCase();
                productId = productNameMap[row.productName.trim().toLowerCase()];
                if (!productId) {
                    for (const [name, id] of Object.entries(productNameMap)) {
                        if (name.includes(cleanName) || cleanName.includes(name)) {
                            productId = id;
                            break;
                        }
                    }
                }
            }
            if (!productId) productId = 1;
            return {
                id: parseInt(row.id),
                cancelledOrderId: parseNullableInt(row.cancelledOrderId),
                productId: productId,
                productName: row.productName,
                quantity: parseInt(row.quantity),
                pricePerUnit: parseNullableFloat(row.pricePerUnit),
                totalPrice: parseNullableFloat(row.totalPrice),
                taxAmount: parseNullableFloat(row.taxAmount),
                netAmount: parseNullableFloat(row.netAmount),
                createdAt: parseDate(row.createdAt),
                updatedAt: parseDate(row.updatedAt)
            };
        };

        // 1. Clear tables
        console.log('Clearing tables...');
        await db.Payment.destroy({ where: {}, truncate: { cascade: true } });
        await db.Invoice.destroy({ where: {}, truncate: { cascade: true } });
        await db.CancelledOrderItem.destroy({ where: {}, truncate: { cascade: true } });
        await db.CancelledOrder.destroy({ where: {}, truncate: { cascade: true } });
        await db.OrderItem.destroy({ where: {}, truncate: { cascade: true } });
        await db.Order.destroy({ where: {}, truncate: { cascade: true } });
        await db.Retailer.destroy({ where: {}, truncate: { cascade: true } });
        console.log('Tables cleared.');

        // 2. Import Retailers
        console.log('Importing Retailers...');
        const retailers = await importCsv(path.join(CSV_DIR, 'retailers.csv'), processRetailer);
        const retailerIds = new Set(retailers.map(r => r.id));
        for (let i = 0; i < retailers.length; i += 100) {
            await db.Retailer.bulkCreate(retailers.slice(i, i + 100));
        }
        console.log(`Imported ${retailers.length} retailers.`);

        // 3. Import Orders
        console.log('Importing Orders...');
        const allOrders = await importCsv(path.join(CSV_DIR, 'updated_Orders.csv'), processOrder);
        const orders = allOrders.filter(o => {
            if (!retailerIds.has(o.retailerId)) {
                console.log(`Warning: Skipping Order ${o.id} - Retailer ${o.retailerId} missing.`);
                return false;
            }
            if (o.salesRepId && !userIds.has(o.salesRepId)) {
                console.log(`Warning: Order ${o.id} - SalesRep ${o.salesRepId} missing. Setting to null.`);
                o.salesRepId = null;
            }
            if (o.driverId && !userIds.has(o.driverId)) {
                console.log(`Warning: Order ${o.id} - Driver ${o.driverId} missing. Setting to null.`);
                o.driverId = null;
            }
            return true;
        });
        const orderIds = new Set(orders.map(o => o.id));
        for (let i = 0; i < orders.length; i += 100) {
            await db.Order.bulkCreate(orders.slice(i, i + 100));
        }
        console.log(`Imported ${orders.length} orders. Skipped ${allOrders.length - orders.length}.`);

        // 4. Import OrderItems
        console.log('Importing OrderItems...');
        const allOrderItems = await importCsv(path.join(CSV_DIR, 'final_updated_orderitems_combined.csv'), processOrderItem);
        const orderItems = allOrderItems.filter(oi => {
            if (!orderIds.has(oi.orderId)) return false;
            if (oi.productId && !productIds.has(oi.productId)) {
                console.log(`Warning: OrderItem ${oi.id} - Product ${oi.productId} missing. Setting to null.`);
                oi.productId = null;
            }
            return true;
        });
        for (let i = 0; i < orderItems.length; i += 100) {
            await db.OrderItem.bulkCreate(orderItems.slice(i, i + 100));
        }
        console.log(`Imported ${orderItems.length} order items. Skipped ${allOrderItems.length - orderItems.length}.`);

        // 5. Import CancelledOrders
        console.log('Importing CancelledOrders...');
        const allCancelledOrders = await importCsv(path.join(CSV_DIR, 'CancelledOrders.csv'), processCancelledOrder);
        const cancelledOrders = allCancelledOrders.filter(co => retailerIds.has(co.retailerId));
        const cancelledOrderIds = new Set(cancelledOrders.map(co => co.id));
        for (let i = 0; i < cancelledOrders.length; i += 100) {
            await db.CancelledOrder.bulkCreate(cancelledOrders.slice(i, i + 100));
        }
        console.log(`Imported ${cancelledOrders.length} cancelled orders. Skipped ${allCancelledOrders.length - cancelledOrders.length}.`);

        // 6. Import CancelledOrderItems
        console.log('Importing CancelledOrderItems...');
        const allCancelledOrderItems = await importCsv(path.join(CSV_DIR, 'CancelledOrderItems.csv'), processCancelledOrderItem);
        const filteredCancelledOrderItems = allCancelledOrderItems.filter(coi => cancelledOrderIds.has(coi.cancelledOrderId));
        for (let i = 0; i < filteredCancelledOrderItems.length; i += 100) {
            await db.CancelledOrderItem.bulkCreate(filteredCancelledOrderItems.slice(i, i + 100));
        }
        console.log(`Imported ${filteredCancelledOrderItems.length} cancelled order items. Skipped ${allCancelledOrderItems.length - filteredCancelledOrderItems.length}.`);

        // 7. Import Invoices
        console.log('Importing Invoices...');
        const allInvoices = await importCsv(path.join(CSV_DIR, 'Updated_Invoices.csv'), processInvoice);
        const invoices = allInvoices.filter(inv => {
            if (!orderIds.has(inv.orderId)) {
                console.log(`Warning: Skipping Invoice ${inv.id} - Order ${inv.orderId} missing.`);
                return false;
            }
            return true;
        });
        const invoiceIds = new Set(invoices.map(inv => inv.id));
        for (let i = 0; i < invoices.length; i += 100) {
            await db.Invoice.bulkCreate(invoices.slice(i, i + 100));
        }
        console.log(`Imported ${invoices.length} invoices. Skipped ${allInvoices.length - invoices.length}.`);

        // 8. Import Payments
        console.log('Importing Payments...');
        const allPayments = await importCsv(path.join(CSV_DIR, 'Updated_Payements.csv'), processPayment);
        const payments = allPayments.map(p => {
            if (p.invoiceId && !invoiceIds.has(p.invoiceId)) {
                console.log(`Warning: Payment ${p.id} - Invoice ${p.invoiceId} missing. Setting to null.`);
                p.invoiceId = null;
            }
            if (p.collectedById && !userIds.has(p.collectedById)) {
                console.log(`Warning: Payment ${p.id} - User ${p.collectedById} missing. Setting to null.`);
                p.collectedById = null;
            }
            return p;
        });
        for (let i = 0; i < payments.length; i += 100) {
            await db.Payment.bulkCreate(payments.slice(i, i + 100));
        }
        console.log(`Imported ${payments.length} payments.`);

        console.log('All data imported successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Error during import:', error.message);
        if (error.original) {
            console.error('Original error:', error.original.message);
        }
        process.exit(1);
    }
};

run();
