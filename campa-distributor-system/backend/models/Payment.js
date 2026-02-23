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
            type: DataTypes.DATEONLY,
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
        },
        approvalStatus: {
            type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
            defaultValue: 'Pending',
            allowNull: false,
        },
        approvedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Admin who approved/rejected this payment'
        },
        approvalNote: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    }, {
        hooks: {
            afterCreate: async (payment) => {
                // Only update invoice balance when payment is Approved
                if (payment.approvalStatus === 'Approved') {
                    const { Invoice } = sequelize.models;
                    if (payment.invoiceId) {
                        await Invoice.updateBalance(payment.invoiceId);
                    }
                }
            },
            afterUpdate: async (payment) => {
                // Trigger balance recalculation when approvalStatus changes
                const { Invoice } = sequelize.models;
                if (payment.invoiceId && payment.changed('approvalStatus')) {
                    await Invoice.updateBalance(payment.invoiceId);
                }
            },
            afterDestroy: async (payment) => {
                // Only if the payment was approved (otherwise balance not affected)
                if (payment.approvalStatus === 'Approved') {
                    const { Invoice } = sequelize.models;
                    if (payment.invoiceId) {
                        await Invoice.updateBalance(payment.invoiceId);
                    }
                }
            }
        }
    });

    return Payment;
};
