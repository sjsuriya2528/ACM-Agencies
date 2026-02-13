const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is missing.');
    // We don't exit here to allow for some flexibility or let the crash happen at connection time,
    // but the user asked for a clear log message.
}

const config = {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {}
};

if (process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
        config.dialectOptions.ssl = {
            require: true,
            rejectUnauthorized: false
        };
    }
} else {
    console.error('CRITICAL ERROR: DATABASE_URL environment variable is NOT set.');
}

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, config)
    : new Sequelize({ dialect: 'postgres' }); // Fallback dummy to prevent immediate crash on require, will fail on sync


const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models (will add as we create them)
db.User = require('./User')(sequelize, Sequelize);
db.Retailer = require('./Retailer')(sequelize, Sequelize);
db.Product = require('./Product')(sequelize, Sequelize);
db.Order = require('./Order')(sequelize, Sequelize);
db.OrderItem = require('./OrderItem')(sequelize, Sequelize);
db.Invoice = require('./Invoice')(sequelize, Sequelize);
db.Delivery = require('./Delivery')(sequelize, Sequelize);
db.Payment = require('./Payment')(sequelize, Sequelize);

// Associations

// User (Role-based)
// Sales Rep creates Orders
db.User.hasMany(db.Order, { as: 'orders', foreignKey: 'salesRepId' });
db.Order.belongsTo(db.User, { as: 'salesRep', foreignKey: 'salesRepId' });

// Retailer has many Orders
db.Retailer.hasMany(db.Order, { as: 'orders', foreignKey: 'retailerId' });
db.Order.belongsTo(db.Retailer, { as: 'retailer', foreignKey: 'retailerId' });

// Order has many OrderItems
db.Order.hasMany(db.OrderItem, { as: 'items', foreignKey: 'orderId' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'orderId' });

// Product is in OrderItems
db.Product.hasMany(db.OrderItem, { foreignKey: 'productId' });
db.OrderItem.belongsTo(db.Product, { foreignKey: 'productId' });

// Order has one Invoice
db.Order.hasOne(db.Invoice, { foreignKey: 'orderId' });
db.Invoice.belongsTo(db.Order, { foreignKey: 'orderId' });

// Invoice has many Payments
db.Invoice.hasMany(db.Payment, { foreignKey: 'invoiceId' });
db.Payment.belongsTo(db.Invoice, { foreignKey: 'invoiceId' });

// Delivery belongs to Invoice (or Order? Invoice usually)
// Plan says: Invoice -> Delivery
db.Invoice.hasOne(db.Delivery, { foreignKey: 'invoiceId' });
db.Delivery.belongsTo(db.Invoice, { foreignKey: 'invoiceId' });

// Delivery assigned to Driver (User)
db.User.hasMany(db.Delivery, { as: 'deliveries', foreignKey: 'driverId' });
db.Delivery.belongsTo(db.User, { as: 'driver', foreignKey: 'driverId' });

// Payment collected by User (Driver or Collector)
db.User.hasMany(db.Payment, { as: 'paymentsCollected', foreignKey: 'collectedById' });
db.Payment.belongsTo(db.User, { as: 'collectedBy', foreignKey: 'collectedById' });

module.exports = db;
