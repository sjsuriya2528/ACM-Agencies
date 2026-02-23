/**
 * One-time migration: creates PurchaseBills and PurchaseBillItems tables
 * in the production database.
 *
 * Run once from your local machine:
 *   node backend/scripts/createPurchaseTables.js
 *
 * Requires your backend .env (or DATABASE_URL env var) to be set.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Sequelize } = require('sequelize');
const pg = require('pg');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: console.log,
    dialectOptions: { ssl: { rejectUnauthorized: false } },
});

const PurchaseBill = require('../models/PurchaseBill')(sequelize, Sequelize);
const PurchaseBillItem = require('../models/PurchaseBillItem')(sequelize, Sequelize);

// Associations
PurchaseBill.hasMany(PurchaseBillItem, { as: 'items', foreignKey: 'purchaseBillId', onDelete: 'CASCADE' });
PurchaseBillItem.belongsTo(PurchaseBill, { foreignKey: 'purchaseBillId' });

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to production database');

        // force:false = never drops existing tables; alter:true = add missing columns
        await PurchaseBill.sync({ alter: true });
        console.log('✅ PurchaseBills table ready');

        await PurchaseBillItem.sync({ alter: true });
        console.log('✅ PurchaseBillItems table ready');

        console.log('\n🎉 Migration complete. You can now use the Purchases feature.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await sequelize.close();
    }
})();
