module.exports = (sequelize, DataTypes) => {
    const Invoice = sequelize.define('Invoice', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        invoiceNumber: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            comment: 'Unique invoice number (e.g., 833)', // From bill
        },
        invoiceDate: {
            type: DataTypes.DATEONLY,
            defaultValue: DataTypes.NOW, // From bill '07/02/2026'
        },


        // Snapshot of Retailer Details (In case retailer details change later)
        customerName: {
            type: DataTypes.STRING, // 'Buyer Name'
        },
        customerAddress: {
            type: DataTypes.TEXT, // 'Address'
        },
        customerGSTIN: {
            type: DataTypes.STRING, // 'Cust GSTin'
        },
        customerPhone: {
            type: DataTypes.STRING, // 'Mobile'
        },

        // Financials
        totalQuantity: {
            type: DataTypes.INTEGER, // 'Total Qty' (3)
        },
        subTotal: {
            type: DataTypes.DECIMAL(10, 2), // Sum of amount before tax or base value
        },

        // GST Breakdown
        cgstTotal: {
            type: DataTypes.DECIMAL(10, 2), // 'CGSTVAL' (7.86)
            defaultValue: 0.00,
        },
        sgstTotal: {
            type: DataTypes.DECIMAL(10, 2), // 'SGSTVAL' (7.86)
            defaultValue: 0.00,
        },
        igstTotal: {
            type: DataTypes.DECIMAL(10, 2), // 'IGSTVAL' (NaN/0)
            defaultValue: 0.00,
        },
        gstTotal: {
            type: DataTypes.DECIMAL(10, 2), // 'GST VALUE' (15.72)
            defaultValue: 0.00,
        },

        discount: {
            type: DataTypes.DECIMAL(10, 2), // 'DISCOUNT' (0)
            defaultValue: 0.00,
        },
        roundOff: {
            type: DataTypes.DECIMAL(10, 2), // 'ROUND OFF' (-0.03)
            defaultValue: 0.00,
        },

        netTotal: {
            type: DataTypes.DECIMAL(10, 2), // 'NET TOTAL' (330) - Final Payable
            allowNull: false,
        },

        // Payment Info
        paymentStatus: {
            type: DataTypes.ENUM('Pending', 'Partially Paid', 'Paid'),
            defaultValue: 'Pending',
        },
        paidAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        balanceAmount: {
            type: DataTypes.DECIMAL(10, 2), // netTotal - paidAmount
        },
        paymentDetails: {
            type: DataTypes.TEXT, // 'Gpay No SURESH...'
        }
    });

    return Invoice;
};
