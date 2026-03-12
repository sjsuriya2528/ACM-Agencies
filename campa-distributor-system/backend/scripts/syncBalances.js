const { sequelize } = require('../models');

async function syncBalances() {
    try {
        await sequelize.authenticate();
        console.log('Database connected. Starting optimized global balance sync...');

        // 1. Update all Invoice balances based on Approved payments
        console.log('Phase 1: Syncing all Invoice balances...');
        
        // Reset all invoices to 0 paid / full balance first (to handle those with no payments)
        await sequelize.query(`
            UPDATE "Invoices"
            SET 
                "paidAmount" = 0,
                "balanceAmount" = "netTotal",
                "paymentStatus" = 'Pending'
        `);

        // Update invoices that DO have approved payments
        await sequelize.query(`
            UPDATE "Invoices"
            SET
                "paidAmount" = CAST(p.total_paid AS DECIMAL(10,2)),
                "balanceAmount" = CAST("netTotal" - p.total_paid AS DECIMAL(10,2)),
                "paymentStatus" = CAST(CASE
                    WHEN ("netTotal" - p.total_paid) <= 0.01 THEN 'Paid'
                    WHEN p.total_paid > 0 THEN 'Partially Paid'
                    ELSE 'Pending'
                END AS "enum_Invoices_paymentStatus")
            FROM (
                SELECT "invoiceId", SUM(amount) as total_paid
                FROM "Payments"
                WHERE "approvalStatus" = 'Approved'
                GROUP BY "invoiceId"
            ) as p
            WHERE "Invoices".id = p."invoiceId"
        `);
        console.log('Phase 1 Complete: All invoice balances synchronized.');

        // 2. Update all Retailer credit balances based on their invoices
        console.log('Phase 2: Syncing all Retailer credit balances...');
        
        // Reset all to 0 first
        await sequelize.query('UPDATE "Retailers" SET "creditBalance" = 0');

        // Update retailers with outstanding amounts
        await sequelize.query(`
            UPDATE "Retailers"
            SET "creditBalance" = inv.total_outstanding
            FROM (
                SELECT r.id as retailer_id, SUM(i."balanceAmount") as total_outstanding
                FROM "Retailers" r
                JOIN "Orders" o ON o."retailerId" = r.id
                JOIN "Invoices" i ON i."orderId" = o.id
                GROUP BY r.id
            ) as inv
            WHERE "Retailers".id = inv.retailer_id
        `);
        console.log('Phase 2 Complete: All retailer credit balances synchronized.');

        console.log('Global balance synchronization successful!');
        process.exit(0);

    } catch (error) {
        console.error('Synchronization failed:', error);
        process.exit(1);
    }
}

syncBalances();
