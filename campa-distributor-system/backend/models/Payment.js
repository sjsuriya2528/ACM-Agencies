module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        paymentMode: {
            type: DataTypes.ENUM('Cash', 'UPI', 'Bank Transfer', 'Cheque'),
            defaultValue: 'Cash',
        },
        transactionId: {
            type: DataTypes.STRING,
            comment: 'For UPI/Bank Transfer',
        },
        paymentDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    });

    return Payment;
};
