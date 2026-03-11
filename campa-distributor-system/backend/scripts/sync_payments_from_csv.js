const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../models');

const CSV_FILE = path.join(__dirname, '../../csv/Updated_Payements.csv');

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

const processPayment = (row) => ({
    amount: parseFloat(row.amount),
    paymentMode: toTitleCase(row.paymentMode),
    transactionId: parseNullableString(row.transactionId),
    paymentReference: parseNullableString(row.paymentReference),
    paymentDate: parseDateOnly(row.paymentDate),
    invoiceId: parseNullableInt(row.invoiceId),
    collectedById: parseNullableInt(row.collectedById),
    retailerName: parseNullableString(row.retailerName),
    approvalStatus: 'Approved',
    createdAt: new Date(),
    updatedAt: new Date()
});

const run = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Database connected.');

        const users = await db.User.findAll({ attributes: ['id'], raw: true });
        const userIds = new Set(users.map(u => u.id));

        const invoices = await db.Invoice.findAll({ attributes: ['id'], raw: true });
        const invoiceIds = new Set(invoices.map(i => i.id));

        // Load CSV
        console.log('Loading Payments from CSV...');
        let allPayments = await importCsv(CSV_FILE, processPayment);
        console.log(`Loaded ${allPayments.length} payments from CSV.`);

        // Sanitize
        allPayments = allPayments.map(p => {
            if (p.collectedById && !userIds.has(p.collectedById)) {
                p.collectedById = null;
            }
            if (p.invoiceId && !invoiceIds.has(p.invoiceId)) {
                console.log(`  Warning: Invoice ${p.invoiceId} not found, setting null.`);
                p.invoiceId = null;
            }
            return p;
        });

        // Count before
        const beforeCount = await db.Payment.count();
        console.log(`Current DB payment count: ${beforeCount}`);

        // Truncate Payments table
        console.log('Clearing Payments table...');
        await db.sequelize.query('TRUNCATE TABLE "Payments" RESTART IDENTITY CASCADE');
        console.log('Payments table cleared.');

        // Re-import all from CSV
        const BATCH = 500;
        let inserted = 0;
        for (let i = 0; i < allPayments.length; i += BATCH) {
            const batch = allPayments.slice(i, i + BATCH);
            await db.Payment.bulkCreate(batch, { logging: false });
            inserted += batch.length;
            console.log(`  Inserted ${inserted} / ${allPayments.length}`);
        }

        const afterCount = await db.Payment.count();
        console.log(`\nPayments sync complete!`);
        console.log(`Before: ${beforeCount} | After: ${afterCount} (CSV had ${allPayments.length})`);
        process.exit(0);
    } catch (error) {
        console.log('--- ERROR ---');
        console.log('Message:', error.message);
        if (error.parent) console.log('Parent:', error.parent.message);
        process.exit(1);
    }
};

run();
