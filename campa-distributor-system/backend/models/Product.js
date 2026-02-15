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
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 18.00,
        },
        hsnCode: {
            type: DataTypes.STRING,
            comment: 'HSN Code for GST',
        },
        stockQuantity: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        bottlesPerCrate: {
            type: DataTypes.INTEGER,
            defaultValue: 24,
        },
        groupName: {
            type: DataTypes.STRING,
            comment: 'Product Group e.g., ORANGE, LEMON',
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    });

    return Product;
};
