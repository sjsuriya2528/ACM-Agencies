/**
 * Migration: adds sellingPrice column to the Products table.
 * Run once from your local machine:
 *   node backend/scripts/addSellingPrice.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Sequelize } = require('sequelize');
const pg = require('pg');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    dialectOptions: { ssl: { rejectUnauthorized: false } },
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to production database');

        // Add sellingPrice column if it doesn't already exist
        await sequelize.query(`
            ALTER TABLE "Products"
            ADD COLUMN IF NOT EXISTS "sellingPrice" DECIMAL(10,4) DEFAULT NULL;
        `);
        console.log('✅ sellingPrice column added (or already exists)');

        // Optional: seed sellingPrice = price for all existing products (can edit later)
        await sequelize.query(`
            UPDATE "Products"
            SET "sellingPrice" = "price"
            WHERE "sellingPrice" IS NULL;
        `);
        console.log('✅ sellingPrice seeded from purchase price for existing products (edit per-product to adjust)');

        console.log('\n🎉 Migration complete.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await sequelize.close();
    }
})();
