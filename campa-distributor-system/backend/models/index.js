'use strict';

const { Sequelize } = require('sequelize');
const pg = require('pg');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is missing.');
}

const config = {
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false
        }
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

const sequelize = new Sequelize(process.env.DATABASE_URL, config);

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function connectWithRetry() {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        try {
            await sequelize.authenticate();
            console.log('✅ Database connected successfully');
            return sequelize;
        } catch (err) {
            retries++;
            console.error(`❌ Database connection attempt ${retries} failed:`, err.message);
            if (retries < MAX_RETRIES) {
                console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                console.error('Max connection retries reached. Exiting.');
                throw err;
            }
        }
    }
}

const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.authenticate = connectWithRetry;

// Import models
db.User = require('./User')(sequelize, Sequelize);
db.Retailer = require('./Retailer')(sequelize, Sequelize);
db.Product = require('./Product')(sequelize, Sequelize);
db.Order = require('./Order')(sequelize, Sequelize);
db.OrderItem = require('./OrderItem')(sequelize, Sequelize);
db.Invoice = require('./Invoice')(sequelize, Sequelize);
db.Delivery = require('./Delivery')(sequelize, Sequelize);
db.Payment = require('./Payment')(sequelize, Sequelize);
db.CancelledOrder = require('./CancelledOrder')(sequelize, Sequelize);
db.CancelledOrderItem = require('./CancelledOrderItem')(sequelize, Sequelize);
db.PurchaseBill = require('./PurchaseBill')(sequelize, Sequelize);
db.PurchaseBillItem = require('./PurchaseBillItem')(sequelize, Sequelize);
db.UserOTP = require('./UserOTP')(sequelize, Sequelize);


// Associations
db.User.hasMany(db.Order, { as: 'orders', foreignKey: 'salesRepId' });
db.Order.belongsTo(db.User, { as: 'salesRep', foreignKey: 'salesRepId' });
db.Retailer.hasMany(db.Order, { as: 'orders', foreignKey: 'retailerId' });
db.Order.belongsTo(db.Retailer, { as: 'retailer', foreignKey: 'retailerId' });
db.Order.hasMany(db.OrderItem, { as: 'items', foreignKey: 'orderId' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'orderId' });
db.Product.hasMany(db.OrderItem, { foreignKey: 'productId' });
db.OrderItem.belongsTo(db.Product, { as: 'product', foreignKey: 'productId' });
db.Order.hasOne(db.Invoice, { as: 'invoice', foreignKey: 'orderId' });
db.Invoice.belongsTo(db.Order, { as: 'order', foreignKey: 'orderId' });
db.Invoice.hasMany(db.Payment, { as: 'payments', foreignKey: 'invoiceId' });
db.Payment.belongsTo(db.Invoice, { as: 'invoice', foreignKey: 'invoiceId' });
db.Invoice.hasOne(db.Delivery, { as: 'delivery', foreignKey: 'invoiceId' });
db.Delivery.belongsTo(db.Invoice, { as: 'invoice', foreignKey: 'invoiceId' });
db.User.hasMany(db.Delivery, { as: 'deliveries', foreignKey: 'driverId' });
db.Delivery.belongsTo(db.User, { as: 'driver', foreignKey: 'driverId' });
db.User.hasMany(db.Payment, { as: 'paymentsCollected', foreignKey: 'collectedById' });
db.Payment.belongsTo(db.User, { as: 'collectedBy', foreignKey: 'collectedById' });
db.User.hasMany(db.Payment, { as: 'paymentsApproved', foreignKey: 'approvedById' });
db.Payment.belongsTo(db.User, { as: 'approvedBy', foreignKey: 'approvedById' });
db.CancelledOrder.hasMany(db.CancelledOrderItem, { as: 'items', foreignKey: 'cancelledOrderId' });
db.CancelledOrderItem.belongsTo(db.CancelledOrder, { foreignKey: 'cancelledOrderId' });
db.CancelledOrder.belongsTo(db.Retailer, { as: 'retailer', foreignKey: 'retailerId' });
db.CancelledOrder.belongsTo(db.User, { as: 'salesRep', foreignKey: 'salesRepId' });
db.Product.hasMany(db.CancelledOrderItem, { foreignKey: 'productId' });
db.CancelledOrderItem.belongsTo(db.Product, { foreignKey: 'productId' });

// UserOTP associations
db.User.hasMany(db.UserOTP, { as: 'otps', foreignKey: 'userId' });
db.UserOTP.belongsTo(db.User, { as: 'user', foreignKey: 'userId' });


db.StockAdjustment = require('./StockAdjustment')(sequelize, Sequelize);

// PurchaseBill associations
db.PurchaseBill.hasMany(db.PurchaseBillItem, { as: 'items', foreignKey: 'purchaseBillId', onDelete: 'CASCADE' });
db.PurchaseBillItem.belongsTo(db.PurchaseBill, { foreignKey: 'purchaseBillId' });
db.PurchaseBillItem.belongsTo(db.Product, { as: 'product', foreignKey: 'productId' });
db.Product.hasMany(db.PurchaseBillItem, { foreignKey: 'productId' });
db.PurchaseBill.belongsTo(db.User, { as: 'createdBy', foreignKey: 'createdById' });

// StockAdjustment associations
db.StockAdjustment.belongsTo(db.Product, { as: 'product', foreignKey: 'productId' });
db.Product.hasMany(db.StockAdjustment, { foreignKey: 'productId' });
db.StockAdjustment.belongsTo(db.User, { as: 'adjustedBy', foreignKey: 'adjustedById' });
db.User.hasMany(db.StockAdjustment, { foreignKey: 'adjustedById' });

// Note: models are initialized synchronously at the top level
// The authenticate function just verifies the connection.

module.exports = db;
