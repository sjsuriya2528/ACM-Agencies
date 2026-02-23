module.exports = (sequelize, DataTypes) => {
    const PurchaseBill = sequelize.define('PurchaseBill', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        billNo: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Our internal purchase bill number (auto-generated)',
        },
        billDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        invoiceNo: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: "Supplier's invoice / challan number",
        },
        supplierName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        subTotal: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            comment: 'Sum of all item amounts before GST',
        },
        cgstAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        sgstAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        roundOff: {
            type: DataTypes.DECIMAL(6, 2),
            defaultValue: 0.00,
        },
        netTotal: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdById: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Admin user who entered this bill',
        },
    });

    return PurchaseBill;
};
