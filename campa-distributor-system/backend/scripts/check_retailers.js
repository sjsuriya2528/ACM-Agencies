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

const getOrders = (filePath) => {
    return new Promise((resolve) => {
        const orders = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                orders.push({ id: data.id, retailerId: parseInt(data.retailerId) });
            })
            .on('end', () => resolve(orders));
    });
};

async function check() {
    const retailerIds = await getIds(path.join(CSV_DIR, 'retailers.csv'));
    const orders = await getOrders(path.join(CSV_DIR, 'updated_Orders.csv'));

    const missingRetailerIds = [];
    for (const order of orders) {
        if (!retailerIds.has(order.retailerId)) {
            missingRetailerIds.push(order);
        }
    }

    console.log(`Total Orders: ${orders.length}`);
    console.log(`Total Retailers: ${retailerIds.size}`);
    console.log(`Orders with missing Retailer IDs: ${missingRetailerIds.length}`);
    if (missingRetailerIds.length > 0) {
        console.log('Sample missing:', missingRetailerIds.slice(0, 10));
    }
}

check();
