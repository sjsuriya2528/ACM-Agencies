module.exports = (sequelize, DataTypes) => {
    const PurchaseBillItem = sequelize.define('PurchaseBillItem', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        purchaseBillId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Optional link to Product — used to update stock',
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Free-text product description as on supplier invoice',
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        rate: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: 'quantity * rate',
        },
    });

    return PurchaseBillItem;
};
