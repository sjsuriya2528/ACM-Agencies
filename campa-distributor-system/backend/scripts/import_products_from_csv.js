const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../models');

const CSV_FILE = path.join(__dirname, '../../csv/Updated_Products.csv');

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
const parseBool = (str) => str && str.trim().toLowerCase() === 'true';

const parseDate = (str) => {
    if (!str || str.trim() === '') return null;
    return new Date(str);
};

const processProduct = (row) => {
    const id = parseNullableInt(row.id);
    if (!id) return null;
    return {
        id,
        name: row.name,
        sku: row.sku || null,
        price: parseNullableFloat(row.price) || 0,
        gstPercentage: parseNullableFloat(row.gstPercentage) || 18,
        stockQuantity: parseNullableInt(row.stockQuantity) || 0,
        bottlesPerCrate: parseNullableInt(row.bottlesPerCrate) || 24,
        isActive: parseBool(row.isActive),
        hsnCode: row.hsnCode || null,
        groupName: row.groupName || null,
        sellingPrice: parseNullableFloat(row.sellingPrice) || 0,
        createdAt: parseDate(row.createdAt) || new Date(),
        updatedAt: parseDate(row.updatedAt) || new Date()
    };
};

const run = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Database connected.');

        console.log('Loading Products from CSV...');
        const allProducts = await importCsv(CSV_FILE, processProduct);
        console.log(`Loaded ${allProducts.length} rows from CSV.`);

        console.log('Upserting products...');
        for (const product of allProducts) {
            console.log(`  Upserting Product ID: ${product.id} (${product.name})`);
            await db.sequelize.query(`
                INSERT INTO "Products" (id, name, sku, price, "sellingPrice", "gstPercentage", "hsnCode", "stockQuantity", "bottlesPerCrate", "groupName", "isActive", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    sku = EXCLUDED.sku,
                    price = EXCLUDED.price,
                    "sellingPrice" = EXCLUDED."sellingPrice",
                    "gstPercentage" = EXCLUDED."gstPercentage",
                    "hsnCode" = EXCLUDED."hsnCode",
                    "stockQuantity" = EXCLUDED."stockQuantity",
                    "bottlesPerCrate" = EXCLUDED."bottlesPerCrate",
                    "groupName" = EXCLUDED."groupName",
                    "isActive" = EXCLUDED."isActive",
                    "updatedAt" = EXCLUDED."updatedAt"
            `, {
                bind: [
                    product.id, product.name, product.sku, product.price, product.sellingPrice,
                    product.gstPercentage, product.hsnCode, product.stockQuantity,
                    product.bottlesPerCrate, product.groupName, product.isActive,
                    product.createdAt, product.updatedAt
                ],
                logging: false
            });
        }

        console.log('Resetting ID sequence...');
        const [[maxRow]] = await db.sequelize.query('SELECT MAX(id) as maxid FROM "Products"');
        const maxId = maxRow.maxid || 0;
        await db.sequelize.query(`SELECT setval('"Products_id_seq"', ${maxId + 1}, false)`);

        console.log(`\nProducts update complete! ${allProducts.length} rows upserted.`);
        process.exit(0);
    } catch (error) {
        console.log('--- ERROR ---');
        console.log('Message:', error.message);
        if (error.parent) console.log('Parent:', error.parent.message);
        process.exit(1);
    }
};

run();
