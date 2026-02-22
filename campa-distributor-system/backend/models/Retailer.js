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

    Retailer.updateCreditBalance = async function (retailerId) {
        const { Invoice, Order } = sequelize.models;

        // Sequelize's .sum() does not support `include` (causes internal TypeError).
        // Instead, find all Invoice IDs belonging to this retailer's orders, then sum.
        const orders = await Order.findAll({
            where: { retailerId },
            attributes: ['id'],
            raw: true,
        });

        const orderIds = orders.map(o => o.id);

        let outstandingAmount = 0;
        if (orderIds.length > 0) {
            outstandingAmount = await Invoice.sum('balanceAmount', {
                where: { orderId: orderIds },
            }) || 0;
        }

        await Retailer.update(
            { creditBalance: outstandingAmount },
            { where: { id: retailerId } }
        );
    };

    return Retailer;
};
