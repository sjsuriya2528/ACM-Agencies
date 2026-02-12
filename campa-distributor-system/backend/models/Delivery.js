module.exports = (sequelize, DataTypes) => {
    const Delivery = sequelize.define('Delivery', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        status: {
            type: DataTypes.ENUM('Pending', 'In Transit', 'Delivered'),
            defaultValue: 'Pending',
        },
        gpsLatitude: {
            type: DataTypes.FLOAT,
            comment: 'Location of delivery',
        },
        gpsLongitude: {
            type: DataTypes.FLOAT,
            comment: 'Location of delivery',
        },
        deliveryTime: {
            type: DataTypes.DATE,
        },
    });

    return Delivery;
};
