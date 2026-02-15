module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        status: {
            type: DataTypes.ENUM('Draft', 'Requested', 'Approved', 'Rejected', 'Dispatched', 'Delivered'),
            defaultValue: 'Requested',
        },
        paymentMode: {
            type: DataTypes.ENUM('Cash', 'Credit'),
            defaultValue: 'Credit',
            allowNull: false,
        },
        driverId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: 'id',
            },
            allowNull: true,
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        billNumber: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true, // Allow null for existing orders, or make it required if new
        },
        discountAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        remarks: {
            type: DataTypes.TEXT,
            comment: 'For special notes or damages',
        },
        gpsLatitude: {
            type: DataTypes.FLOAT,
            comment: 'Location where order was taken',
        },
        gpsLongitude: {
            type: DataTypes.FLOAT,
            comment: 'Location where order was taken',
        },
    });

    return Order;
};
