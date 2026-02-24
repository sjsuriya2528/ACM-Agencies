module.exports = (sequelize, DataTypes) => {
    const StockAdjustment = sequelize.define('StockAdjustment', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        productId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('Addition', 'Reduction'),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Quantity in bottles',
        },
        remarks: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        adjustedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }
    });

    return StockAdjustment;
};
