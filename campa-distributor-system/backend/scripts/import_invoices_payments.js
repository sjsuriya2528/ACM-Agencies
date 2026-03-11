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
                if (processed) results.push(processed);
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

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

const processInvoice = (row) => ({
    id: parseInt(row.id),
    paidAmount: parseNullableFloat(row.paidAmount) || 0.0,
    balanceAmount: parseNullableFloat(row.balanceAmount),
    paymentStatus: row.paymentStatus || 'Pending',
    createdAt: parseDate(row.createdAt) || new Date(),
    updatedAt: parseDate(row.updatedAt) || new Date(),
    orderId: parseNullableInt(row.orderId),
    invoiceDate: parseDateOnly(row.invoiceDate),
    invoiceNumber: parseNullableString(row.invoiceNumber),
    customerName: row.customerName || null,
    customerAddress: row.customerAddress || null,
    customerGSTIN: row.customerGSTIN || null,
    customerPhone: row.customerPhone || null,
    totalQuantity: parseNullableInt(row.totalQuantity),
    subTotal: parseNullableFloat(row.subTotal),
    cgstTotal: parseNullableFloat(row.cgstTotal) || 0,
    sgstTotal: parseNullableFloat(row.sgstTotal) || 0,
    igstTotal: parseNullableFloat(row.igstTotal) || 0,
    gstTotal: parseNullableFloat(row.gstTotal) || 0,
    discount: parseNullableFloat(row.discount) || 0,
    roundOff: parseNullableFloat(row.roundOff) || 0,
    netTotal: parseNullableFloat(row.netTotal) || 0,
    paymentDetails: row.paymentDetails || null
});

const processPayment = (row) => ({
    amount: parseFloat(row.amount),
    paymentMode: toTitleCase(row.paymentMode),
    transactionId: row.transactionId || null,
    paymentReference: row.paymentReference || null,
    paymentDate: parseDateOnly(row.paymentDate),
    invoiceId: parseNullableInt(row.invoiceId),
    collectedById: parseNullableInt(row.collectedById),
    retailerName: row.retailerName || null,
    approvalStatus: 'Approved',
    createdAt: new Date(),
    updatedAt: new Date()
});

const run = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Database connected.');

        const users = await db.User.findAll();
        const userIds = new Set(users.map(u => u.id));

        // Load all invoices from CSV
        console.log('Loading invoices from CSV...');
        const allInvoices = await importCsv(path.join(CSV_DIR, 'Updated_Invoices.csv'), processInvoice);
        console.log(`Loaded ${allInvoices.length} invoices from CSV.`);

        // Get existing invoice IDs from DB
        const [existingRows] = await db.sequelize.query('SELECT id FROM "Invoices"');
        const existingIds = new Set(existingRows.map(r => r.id));
        console.log(`Existing DB invoices: ${existingIds.size}`);

        const toInsert = allInvoices.filter(inv => !existingIds.has(inv.id));
        const toUpdate = allInvoices.filter(inv => existingIds.has(inv.id));
        console.log(`To insert: ${toInsert.length}, To update: ${toUpdate.length}`);

        // Insert new invoices in batches using raw INSERT to bypass Sequelize hooks/validation
        let inserted = 0;
        const BATCH = 100;
        for (let i = 0; i < toInsert.length; i += BATCH) {
            const batch = toInsert.slice(i, i + BATCH);
            // Build parameterized raw INSERT
            const values = batch.map(inv => [
                inv.id, inv.invoiceNumber, inv.invoiceDate,
                inv.customerName, inv.customerAddress, inv.customerGSTIN, inv.customerPhone,
                inv.totalQuantity, inv.subTotal,
                inv.cgstTotal, inv.sgstTotal, inv.igstTotal, inv.gstTotal,
                inv.discount, inv.roundOff, inv.netTotal,
                inv.paymentStatus, inv.paidAmount, inv.balanceAmount,
                inv.paymentDetails, inv.orderId,
                inv.createdAt, inv.updatedAt
            ]);

            for (const vals of values) {
                await db.sequelize.query(
                    `INSERT INTO "Invoices" (id, "invoiceNumber", "invoiceDate",
                        "customerName", "customerAddress", "customerGSTIN", "customerPhone",
                        "totalQuantity", "subTotal",
                        "cgstTotal", "sgstTotal", "igstTotal", "gstTotal",
                        discount, "roundOff", "netTotal",
                        "paymentStatus", "paidAmount", "balanceAmount",
                        "paymentDetails", "orderId", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
                    ON CONFLICT (id) DO NOTHING`,
                    { bind: vals, logging: false }
                );
                inserted++;
            }
            console.log(`  Inserted: ${Math.min(i + BATCH, toInsert.length)} / ${toInsert.length}`);
        }

        // Update existing invoices in batches
        let updated = 0;
        for (let i = 0; i < toUpdate.length; i += BATCH) {
            const batch = toUpdate.slice(i, i + BATCH);
            for (const inv of batch) {
                await db.sequelize.query(
                    `UPDATE "Invoices" SET
                        "invoiceNumber"=$1, "invoiceDate"=$2,
                        "customerName"=$3, "customerAddress"=$4, "customerGSTIN"=$5, "customerPhone"=$6,
                        "totalQuantity"=$7, "subTotal"=$8,
                        "cgstTotal"=$9, "sgstTotal"=$10, "igstTotal"=$11, "gstTotal"=$12,
                        discount=$13, "roundOff"=$14, "netTotal"=$15,
                        "paymentStatus"=$16, "paidAmount"=$17, "balanceAmount"=$18,
                        "paymentDetails"=$19, "orderId"=$20, "updatedAt"=$21
                    WHERE id=$22`,
                    {
                        bind: [
                            inv.invoiceNumber, inv.invoiceDate,
                            inv.customerName, inv.customerAddress, inv.customerGSTIN, inv.customerPhone,
                            inv.totalQuantity, inv.subTotal,
                            inv.cgstTotal, inv.sgstTotal, inv.igstTotal, inv.gstTotal,
                            inv.discount, inv.roundOff, inv.netTotal,
                            inv.paymentStatus, inv.paidAmount, inv.balanceAmount,
                            inv.paymentDetails, inv.orderId, inv.updatedAt,
                            inv.id
                        ],
                        logging: false
                    }
                );
                updated++;
            }
            console.log(`  Updated: ${Math.min(i + BATCH, toUpdate.length)} / ${toUpdate.length}`);
        }

        console.log(`Invoices complete: ${inserted} inserted, ${updated} updated.`);

        // Reset sequence to above max id
        const [[maxRow]] = await db.sequelize.query('SELECT MAX(id) as maxid FROM "Invoices"');
        const maxId = maxRow.maxid || 0;
        await db.sequelize.query(`SELECT setval('"Invoices_id_seq"', ${maxId + 1}, false)`);
        console.log(`Invoices sequence reset to ${maxId + 1}`);

        // Import Payments
        console.log('Updating Payments...');
        const allPayments = await importCsv(path.join(CSV_DIR, 'Updated_Payements.csv'), processPayment);

        const existingPayments = await db.Payment.findAll({ attributes: ['invoiceId', 'amount', 'paymentMode'], raw: true });
        const exSet = new Set(existingPayments.map(p => `${p.invoiceId}-${p.amount}-${p.paymentMode}`));

        const invoiceIdSet = new Set((await db.Invoice.findAll({ attributes: ['id'], raw: true })).map(i => i.id));

        const newPayments = [];
        for (const p of allPayments) {
            if (p.collectedById && !userIds.has(p.collectedById)) p.collectedById = null;
            if (p.invoiceId && !invoiceIdSet.has(p.invoiceId)) {
                console.log(`  Warning: Payment invoice ${p.invoiceId} not in DB. Setting null.`);
                p.invoiceId = null;
            }
            const key = `${p.invoiceId}-${p.amount}-${p.paymentMode}`;
            if (!exSet.has(key)) {
                newPayments.push(p);
                exSet.add(key);
            }
        }

        if (newPayments.length > 0) {
            for (let i = 0; i < newPayments.length; i += 500) {
                await db.Payment.bulkCreate(newPayments.slice(i, i + 500), { logging: false });
                console.log(`  Payments: ${Math.min(i + 500, newPayments.length)} / ${newPayments.length}`);
            }
        }
        console.log(`Payments: ${newPayments.length} new inserted, ${allPayments.length - newPayments.length} already existed.`);

        console.log('\nInvoices & Payments import complete!');
        process.exit(0);
    } catch (error) {
        console.log('--- ERROR ---');
        console.log('Message:', error.message);
        if (error.parent) console.log('Parent:', error.parent.message);
        process.exit(1);
    }
};

run();
