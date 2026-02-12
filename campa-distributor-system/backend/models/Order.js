module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        status: {
            type: DataTypes.ENUM('Draft', 'Requested', 'Approved', 'Rejected'),
            defaultValue: 'Requested',
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
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
