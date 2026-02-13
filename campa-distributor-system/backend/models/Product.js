module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        sku: {
            type: DataTypes.STRING,
            unique: true,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        gstPercentage: {
            type: DataTypes.FLOAT,
            defaultValue: 18.0,
        },
        stockQuantity: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        bottlesPerCrate: {
            type: DataTypes.INTEGER,
            defaultValue: 24,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    });

    return Product;
};
