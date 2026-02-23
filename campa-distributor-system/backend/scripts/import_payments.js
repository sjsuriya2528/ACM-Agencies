const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../models');

const CSV_FILE = path.join(__dirname, '../../csv/Updated_Payements.csv');

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

    // Check if it's already in a standard format (like ISO)
    if (str.includes('-') && str.includes('T')) return new Date(str);
    if (str.includes('-') && str.length > 10) return new Date(str);

    // Handle DD/MM/YYYY HH:MM AM/PM
    const parts = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+([AP]M)/i);
    if (parts) {
        const [_, day, month, year, hours, minutes, ampm] = parts;
        let h = parseInt(hours, 10);
        if (ampm.toUpperCase() === 'PM' && h < 12) h += 12;
        if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
        return new Date(year, month - 1, day, h, minutes);
    }

    return new Date(str);
};

const importCsv = (filePath, validInvoiceIds, validUserIds) => {
    return new Promise((resolve, reject) => {
        const results = [];
        let skippedInvoices = 0;
        let skippedUsers = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const invoiceId = parseNullableInt(row.invoiceId);
                const collectedById = parseNullableInt(row.collectedById);

                let finalInvoiceId = invoiceId;
                if (invoiceId && !validInvoiceIds.has(invoiceId)) {
                    finalInvoiceId = null;
                    skippedInvoices++;
                }

                let finalCollectedById = collectedById;
                if (collectedById && !validUserIds.has(collectedById)) {
                    finalCollectedById = null;
                    skippedUsers++;
                }

                results.push({
                    id: parseInt(row.id),
                    amount: parseNullableFloat(row.amount),
                    paymentMode: row.paymentMode || 'Cash',
                    transactionId: parseNullableString(row.transactionId),
                    paymentReference: parseNullableString(row.paymentReference),
                    paymentDate: parseDate(row.paymentDate),
                    createdAt: parseDate(row.createdAt) || new Date(),
                    updatedAt: parseDate(row.updatedAt) || new Date(),
                    invoiceId: finalInvoiceId,
                    collectedById: finalCollectedById,
                    retailerName: parseNullableString(row.retailerName),
                    approvalStatus: 'Approved', // Ensure all imported payments are approved
                    approvedById: null // System import
                });
            })
            .on('end', () => {
                if (skippedInvoices > 0) console.log(`Skipped ${skippedInvoices} invalid invoice links.`);
                if (skippedUsers > 0) console.log(`Skipped ${skippedUsers} invalid user links.`);
                resolve(results);
            })
            .on('error', (err) => reject(err));
    });
};

const run = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Database connected.');

        // 0. Fetch valid IDs to avoid FK violations
        const invoices = await db.Invoice.findAll({ attributes: ['id'] });
        const validInvoiceIds = new Set(invoices.map(i => i.id));
        const users = await db.User.findAll({ attributes: ['id', 'role'] });
        const validUserIds = new Set(users.map(u => u.id));

        // 1. Clear payments table
        console.log('Clearing Payment table...');
        await db.Payment.destroy({ where: {}, truncate: { cascade: true } });
        console.log('Payment table cleared.');

        // 2. Import from CSV
        console.log(`Reading CSV file: ${CSV_FILE}...`);
        const payments = await importCsv(CSV_FILE, validInvoiceIds, validUserIds);
        console.log(`Found ${payments.length} records in CSV.`);

        // 3. Bulk create
        console.log('Importing payments incrementally...');
        const batchSize = 100;
        const affectedInvoiceIds = new Set();
        for (let i = 0; i < payments.length; i += batchSize) {
            const batch = payments.slice(i, i + batchSize);
            await db.Payment.bulkCreate(batch);
            batch.forEach(p => { if (p.invoiceId) affectedInvoiceIds.add(p.invoiceId); });
            console.log(`Imported ${i + batch.length}/${payments.length} records.`);
        }

        // 4. Update balances for all affected invoices
        console.log(`Updating balances for ${affectedInvoiceIds.size} invoices...`);
        const invArray = Array.from(affectedInvoiceIds);
        for (let i = 0; i < invArray.length; i++) {
            await db.Invoice.updateBalance(invArray[i]);
            if ((i + 1) % 50 === 0) console.log(`Updated ${i + 1}/${invArray.length} invoice balances.`);
        }

        // 5. Update retailer credit balances
        // We can just update ALL retailers since many might be affected
        console.log('Updating retailer credit balances...');
        const retailers = await db.Retailer.findAll({ attributes: ['id'] });
        for (let i = 0; i < retailers.length; i++) {
            await db.Retailer.updateCreditBalance(retailers[i].id);
            if ((i + 1) % 50 === 0) console.log(`Updated ${i + 1}/${retailers.length} retailers.`);
        }

        // 6. Reset sequence
        console.log('Resetting "Payments_id_seq"...');
        const [result] = await db.sequelize.query(`SELECT MAX(id) FROM "Payments"`);
        const maxId = result[0].max || 0;
        await db.sequelize.query(`ALTER SEQUENCE "Payments_id_seq" RESTART WITH ${maxId + 1}`);

        console.log('✅ Import and balance sync completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during import:', error.message);
        if (error.original) {
            console.error('Original error:', error.original.message);
        }
        process.exit(1);
    }
};

run();
