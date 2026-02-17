module.exports = (sequelize, DataTypes) => {
    const CancelledOrderItem = sequelize.define('CancelledOrderItem', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        cancelledOrderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        productName: {
            type: DataTypes.STRING,
        },
        quantity: {
            type: DataTypes.INTEGER,
        },
        pricePerUnit: {
            type: DataTypes.DECIMAL(10, 2),
        },
        totalPrice: {
            type: DataTypes.DECIMAL(10, 2),
        },
        taxAmount: {
            type: DataTypes.DECIMAL(10, 2),
        },
        netAmount: {
            type: DataTypes.DECIMAL(10, 2),
        },
    });

    return CancelledOrderItem;
};
