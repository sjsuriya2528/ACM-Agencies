const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../models');

const CSV_FILE = path.join(__dirname, '../../csv/final_updated_orderitems_combined.csv');

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

const processOrderItem = (row) => {
    const id = parseNullableInt(row.id);
    if (!id) return null; // skip rows without id (can't upsert without PK)
    return {
        id,
        quantity: parseInt(row.quantity) || 0,
        pricePerUnit: parseNullableFloat(row.pricePerUnit),
        totalPrice: parseNullableFloat(row.totalPrice),
        createdAt: parseDate(row.createdAt) || new Date(),
        updatedAt: parseDate(row.updatedAt) || new Date(),
        orderId: parseNullableInt(row.orderId),
        productId: parseNullableInt(row.productId),
        gstPercentage: parseNullableFloat(row.gstPercentage) || 18,
        taxAmount: parseNullableFloat(row.taxAmount),
        netAmount: parseNullableFloat(row.netAmount),
        productName: row.productName || null
    };
};

const run = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Database connected.');

        const products = await db.Product.findAll({ attributes: ['id'], raw: true });
        const productIds = new Set(products.map(p => p.id));

        console.log('Loading OrderItems from CSV...');
        let allItems = await importCsv(CSV_FILE, processOrderItem);
        console.log(`Loaded ${allItems.length} rows from CSV.`);

        // Sanitize productIds
        allItems = allItems.map(oi => {
            if (oi.productId && !productIds.has(oi.productId)) {
                console.log(`  Warning: Product ${oi.productId} not found, setting null.`);
                oi.productId = null;
            }
            return oi;
        });

        const updateCols = Object.keys(db.OrderItem.rawAttributes).filter(attr => attr !== 'id');

        const BATCH = 500;
        let processed = 0;
        for (let i = 0; i < allItems.length; i += BATCH) {
            const batch = allItems.slice(i, i + BATCH);
            await db.OrderItem.bulkCreate(batch, {
                updateOnDuplicate: updateCols,
                logging: false
            });
            processed += batch.length;
            console.log(`  Processed ${processed} / ${allItems.length}`);
        }

        console.log(`\nOrderItems update complete! ${allItems.length} rows upserted.`);
        process.exit(0);
    } catch (error) {
        console.log('--- ERROR ---');
        console.log('Message:', error.message);
        if (error.parent) console.log('Parent:', error.parent.message);
        process.exit(1);
    }
};

run();
