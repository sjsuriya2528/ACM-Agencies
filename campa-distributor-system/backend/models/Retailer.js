module.exports = (sequelize, DataTypes) => {
    const Retailer = sequelize.define('Retailer', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        shopName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ownerName: {
            type: DataTypes.STRING,
        },
        phone: {
            type: DataTypes.STRING,
        },
        address: {
            type: DataTypes.TEXT,
        },
        gpsLatitude: {
            type: DataTypes.FLOAT,
        },
        gpsLongitude: {
            type: DataTypes.FLOAT,
        },
        externalId: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Code from Excel import',
        },
        routeName: {
            type: DataTypes.STRING,
            comment: 'Delivery route name',
        },
        creditBalance: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    });

    return Retailer;
};
