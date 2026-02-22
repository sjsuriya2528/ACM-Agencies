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
        paymentReference: {
            type: DataTypes.STRING,
            comment: 'Cheque No, UPI Ref, etc.',
        },
        paymentDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        invoiceId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        collectedById: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        retailerName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Denormalized field for easier reporting'
        }
    }, {
        hooks: {
            afterCreate: async (payment) => {
                const { Invoice } = sequelize.models;
                if (payment.invoiceId) {
                    await Invoice.updateBalance(payment.invoiceId);
                }
            },
            afterUpdate: async (payment) => {
                const { Invoice } = sequelize.models;
                if (payment.invoiceId) {
                    await Invoice.updateBalance(payment.invoiceId);
                }
            },
            afterDestroy: async (payment) => {
                const { Invoice } = sequelize.models;
                if (payment.invoiceId) {
                    await Invoice.updateBalance(payment.invoiceId);
                }
            }
        }
    });

    return Payment;
};
