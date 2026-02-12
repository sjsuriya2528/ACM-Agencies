const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
});

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
