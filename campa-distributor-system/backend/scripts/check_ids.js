const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_DIR = path.join(__dirname, '../../csv');

const getIds = (filePath) => {
    return new Promise((resolve) => {
        const ids = new Set();
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                if (data.id) ids.add(parseInt(data.id));
            })
            .on('end', () => resolve(ids));
    });
};

const getInvoices = (filePath) => {
    return new Promise((resolve) => {
        const invoices = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                invoices.push({ id: data.id, orderId: parseInt(data.orderId) });
            })
            .on('end', () => resolve(invoices));
    });
};

async function check() {
    const orderIds = await getIds(path.join(CSV_DIR, 'updated_Orders.csv'));
    const invoices = await getInvoices(path.join(CSV_DIR, 'Updated_Invoices.csv'));

    const missingOrderIds = [];
    for (const inv of invoices) {
        if (!orderIds.has(inv.orderId)) {
            missingOrderIds.push(inv);
        }
    }

    console.log(`Total Invoices: ${invoices.length}`);
    console.log(`Total Orders: ${orderIds.size}`);
    console.log(`Invoices with missing Order IDs: ${missingOrderIds.length}`);
    if (missingOrderIds.length > 0) {
        console.log('Sample missing:', missingOrderIds.slice(0, 10));
    }
}

check();
