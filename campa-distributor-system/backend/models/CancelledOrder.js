module.exports = (sequelize, DataTypes) => {
    const CancelledOrder = sequelize.define('CancelledOrder', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            comment: 'Original Order ID',
        },
        retailerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        salesRepId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            comment: 'Status at time of cancellation',
        },
        paymentMode: {
            type: DataTypes.STRING,
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
        },
        billNumber: {
            type: DataTypes.STRING,
        },
        remarks: {
            type: DataTypes.TEXT,
        },
        gpsLatitude: {
            type: DataTypes.FLOAT,
        },
        gpsLongitude: {
            type: DataTypes.FLOAT,
        },
        originalCreatedAt: {
            type: DataTypes.DATE,
        },
        cancelledAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        indexes: [
            {
                fields: ['cancelledAt']
            }
        ]
    });

    return CancelledOrder;
};
