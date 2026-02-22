const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const CSV_DIR = path.join(__dirname, '../../csv');
const ORDERS_FILE = path.join(CSV_DIR, 'updated_Orders.csv');
const INVOICES_FILE = path.join(CSV_DIR, 'Updated_Invoices.csv');

// Configuration
const TODAY = new Date('2026-02-18T12:00:00'); // Fixed "Today" for consistency
const DAYS_BACK = 14;
const PERCENT_TODAY = 0.15; // 15% for today to ensure good volume

const getRandomDate = () => {
    const isToday = Math.random() < PERCENT_TODAY;
    const date = new Date(TODAY);

    if (!isToday) {
        const daysAgo = Math.floor(Math.random() * (DAYS_BACK - 1)) + 1;
        date.setDate(date.getDate() - daysAgo);
    }

    // Randomize time between 9 AM and 8 PM
    const hour = Math.floor(Math.random() * 11) + 9;
    const minute = Math.floor(Math.random() * 60);
    date.setHours(hour, minute, 0, 0);

    return date;
};

const formatDateISO = (date) => date.toISOString();
const formatDateYYYYMMDD = (date) => date.toISOString().split('T')[0];

const processFile = (filePath, type) => {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const newDate = getRandomDate();

                // Update specific fields based on file type
                if (type === 'orders') {
                    row.createdAt = formatDateISO(newDate);
                    row.updatedAt = formatDateISO(newDate);
                } else if (type === 'invoices') {
                    row.createdAt = formatDateISO(newDate);
                    row.updatedAt = formatDateISO(newDate);
                    row.invoiceDate = formatDateYYYYMMDD(newDate);
                }
                rows.push(row);
            })
            .on('end', async () => {
                // Get headers from first row
                if (rows.length === 0) return resolve();
                const header = Object.keys(rows[0]).map(id => ({ id, title: id }));

                const csvWriter = createObjectCsvWriter({
                    path: filePath,
                    header: header
                });

                await csvWriter.writeRecords(rows);
                console.log(`Updated ${rows.length} records in ${path.basename(filePath)}`);
                resolve();
            })
            .on('error', reject);
    });
};

const run = async () => {
    try {
        console.log('Distributing dates in CSV files...');

        await processFile(ORDERS_FILE, 'orders');
        await processFile(INVOICES_FILE, 'invoices');

        console.log('Date distribution complete.');
    } catch (error) {
        console.error('Error:', error);
    }
};

run();
