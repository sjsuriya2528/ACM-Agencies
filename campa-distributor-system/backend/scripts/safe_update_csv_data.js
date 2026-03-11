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

const parseBool = (str) => str ? str.toLowerCase() === 'true' : false;
const parseNullableInt = (str) => str && str.trim() !== '' && !isNaN(parseInt(str, 10)) ? parseInt(str, 10) : null;
const parseNullableFloat = (str) => str && str.trim() !== '' && !isNaN(parseFloat(str)) ? parseFloat(str) : null;
const parseNullableString = (str) => str && str.trim() !== '' ? str.trim() : null;

const parseDate = (str) => {
    if (!str || str.trim() === '') return null;
    if (str.includes('/')) {
        const [datePart, timePart, ampm] = str.split(' ');
        const [day, month, year] = datePart.split('/');
        let [hours, minutes] = timePart.split(':');
        hours = parseInt(hours);
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return new Date(Date.UTC(year, month - 1, day, hours, minutes));
    }
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

const toTitleCase = (str) => {
    if (!str || str.trim() === '') return null;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
    status: toTitleCase(row.status),
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
    paymentMode: toTitleCase(row.paymentMode)
});

const processOrderItem = (row) => ({
    id: parseNullableInt(row.id), 
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
    status: toTitleCase(row.status),
    paymentMode: toTitleCase(row.paymentMode),
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
    amount: parseFloat(row.amount),
    paymentMode: toTitleCase(row.paymentMode),
    transactionId: row.transactionId,
    paymentReference: row.paymentReference,
    paymentDate: parseDateOnly(row.paymentDate),
    invoiceId: parseNullableInt(row.invoiceId),
    collectedById: parseNullableInt(row.collectedById),
    retailerName: row.retailerName,
    approvalStatus: 'Approved',
    createdAt: new Date(),
    updatedAt: new Date()
});

const bulkUpsert = async (model, dataArr) => {
    if (dataArr.length === 0) return 0;
    const updateCols = Object.keys(model.rawAttributes).filter(attr => attr !== 'id');
    for (let i = 0; i < dataArr.length; i += 500) {
        const batch = dataArr.slice(i, i + 500);
        await model.bulkCreate(batch, {
            updateOnDuplicate: updateCols,
            logging: false
        });
        console.log(`  Processed ${Math.min(i + 500, dataArr.length)} / ${dataArr.length} records...`);
    }
    return dataArr.length;
}

const run = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Database connected.');

        // Load specific helpers
        const products = await db.Product.findAll();
        const productNameMap = {};
        products.forEach(p => { productNameMap[p.name.trim().toLowerCase()] = p.id; });
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
                        if (name.includes(cleanName) || cleanName.includes(name)) { productId = id; break; }
                    }
                }
            }
            if (!productId) productId = 1; 
            return {
                id: parseNullableInt(row.id),
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

        // 1. Retailers
        console.log('Updating Retailers...');
        const retailers = await importCsv(path.join(CSV_DIR, 'retailers.csv'), processRetailer);
        await bulkUpsert(db.Retailer, retailers);
        console.log(`Retailers updated. (${retailers.length})`);

        // 2. Orders 
        console.log('Updating Orders...');
        let allOrders = await importCsv(path.join(CSV_DIR, 'updated_Orders.csv'), processOrder);
        let validOrders = allOrders.map(o => {
            if (o.salesRepId && !userIds.has(o.salesRepId)) o.salesRepId = null;
            if (o.driverId && !userIds.has(o.driverId)) o.driverId = null;
            return o;
        }).filter(o => o.id && !isNaN(o.id));
        
        await bulkUpsert(db.Order, validOrders);
        console.log(`Orders updated. (${validOrders.length})`);

        // 3. OrderItems
        console.log('Updating OrderItems...');
        let allOrderItems = await importCsv(path.join(CSV_DIR, 'final_updated_orderitems_combined.csv'), processOrderItem);
        allOrderItems = allOrderItems.map(oi => {
            if (oi.productId && !productIds.has(oi.productId)) { oi.productId = null; }
            return oi;
        }).filter(oi => oi.id); // Bulk upsert strictly requires IDs or auto increment conflicts happen
        await bulkUpsert(db.OrderItem, allOrderItems);
        console.log(`OrderItems updated. (${allOrderItems.length})`);

        // 4. CancelledOrders
        console.log('Updating CancelledOrders...');
        let allCancelledOrders = await importCsv(path.join(CSV_DIR, 'CancelledOrders.csv'), processCancelledOrder);
        await bulkUpsert(db.CancelledOrder, allCancelledOrders);
        console.log(`Cancelled orders updated. (${allCancelledOrders.length})`);

        // 5. CancelledOrderItems
        console.log('Updating CancelledOrderItems...');
        let allCancelledOrderItems = await importCsv(path.join(CSV_DIR, 'CancelledOrderItems.csv'), processCancelledOrderItem);
        allCancelledOrderItems = allCancelledOrderItems.filter(coi => coi.id);
        await bulkUpsert(db.CancelledOrderItem, allCancelledOrderItems);
        console.log(`Cancelled order items updated. (${allCancelledOrderItems.length})`);

        // 6. Invoices
        console.log('Updating Invoices...');
        let allInvoices = await importCsv(path.join(CSV_DIR, 'Updated_Invoices.csv'), processInvoice);
        await bulkUpsert(db.Invoice, allInvoices);
        console.log(`Invoices updated. (${allInvoices.length})`);

        // 7. Payments
        console.log('Updating Payments (Safe insert via lookup)...');
        const allPayments = await importCsv(path.join(CSV_DIR, 'Updated_Payements.csv'), processPayment);
        let newPaymentsCount = 0;
        
        // Fetch existing payments hash map to avoid line-by-line DB checks
        const existingPayments = await db.Payment.findAll({ attributes: ['invoiceId', 'amount', 'paymentMode'], raw: true });
        const exSet = new Set(existingPayments.map(p => `${p.invoiceId}-${p.amount}-${p.paymentMode}`));

        const newPaymentsToInsert = [];
        for (const p of allPayments) {
            if (p.collectedById && !userIds.has(p.collectedById)) p.collectedById = null;
            if (p.invoiceId) {
                const key = `${p.invoiceId}-${p.amount}-${p.paymentMode}`;
                if (!exSet.has(key)) {
                    newPaymentsToInsert.push(p);
                    exSet.add(key); 
                }
            } else {
                newPaymentsToInsert.push(p);
            }
        }
        
        if (newPaymentsToInsert.length > 0) {
            for (let i = 0; i < newPaymentsToInsert.length; i += 500) {
                await db.Payment.bulkCreate(newPaymentsToInsert.slice(i, i + 500), { logging: false });
            }
            newPaymentsCount = newPaymentsToInsert.length;
        }

        console.log(`Payments processed. Inserted ${newPaymentsCount} new payments.`);

        console.log('Safe database update complete.');
        process.exit(0);

    } catch (error) {
        console.log('--- ERROR ---');
        console.log('Message:', error.message);
        if (error.parent) console.log('Parent:', error.parent.message);
        process.exit(1);
    }
};

run();
