module.exports = (sequelize, DataTypes) => {
    const OrderItem = sequelize.define('OrderItem', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
            },
        },
        productName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Snapshot of product name at time of order',
        },
        pricePerUnit: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        gstPercentage: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 18.00,
        },
        totalPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: 'Excluding Tax (Taxable Value)',
        },
        taxAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true, // Make nullable for backward compat
        },
        netAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true, // Make nullable for backward compat
            comment: 'Total including Tax',
        },
    }, {
        indexes: [
            {
                fields: ['orderId']
            },
            {
                fields: ['productId']
            }
        ]
    });

    return OrderItem;
};
