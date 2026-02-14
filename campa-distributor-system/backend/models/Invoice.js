module.exports = (sequelize, DataTypes) => {
    const Invoice = sequelize.define('Invoice', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        paidAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        balanceAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        paymentStatus: {
            type: DataTypes.ENUM('Pending', 'Partially Paid', 'Paid'),
            defaultValue: 'Pending',
        },
        invoiceDate: {
            type: DataTypes.DATEONLY,
        },
    });

    return Invoice;
};
