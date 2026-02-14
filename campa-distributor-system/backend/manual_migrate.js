const { sequelize } = require('./models');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected. Running manual migration...');

        // 1. Retailers
        try {
            await sequelize.query(`ALTER TABLE "Retailers" ADD COLUMN IF NOT EXISTS "externalId" VARCHAR(255) UNIQUE;`);
            await sequelize.query(`COMMENT ON COLUMN "Retailers"."externalId" IS 'Code from Excel import';`);
            await sequelize.query(`ALTER TABLE "Retailers" ADD COLUMN IF NOT EXISTS "routeName" VARCHAR(255);`);
            await sequelize.query(`COMMENT ON COLUMN "Retailers"."routeName" IS 'Delivery route name';`);
            console.log('Retailers updated.');
        } catch (e) {
            console.error('Retailers update failed (might already exist):', e.message);
        }

        // 2. Products
        try {
            await sequelize.query(`ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "gstPercentage" DECIMAL(5, 2) DEFAULT 18.00;`);
            // Note: If column exists, we might need to alter it, but IF NOT EXISTS handles new col.
            // To modify existing column type:
            // await sequelize.query(`ALTER TABLE "Products" ALTER COLUMN "gstPercentage" TYPE DECIMAL(5, 2);`);
            await sequelize.query(`ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "hsnCode" VARCHAR(255);`);
            await sequelize.query(`COMMENT ON COLUMN "Products"."hsnCode" IS 'HSN Code for GST';`);
            console.log('Products updated.');
        } catch (e) { console.error('Products update failed:', e.message); }

        // 3. Orders
        try {
            await sequelize.query(`ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "billNumber" VARCHAR(255) UNIQUE;`);
            await sequelize.query(`ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(10, 2) DEFAULT 0.00;`);
            await sequelize.query(`ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "remarks" TEXT;`);
            await sequelize.query(`COMMENT ON COLUMN "Orders"."remarks" IS 'For special notes or damages';`);
            console.log('Orders updated.');
        } catch (e) { console.error('Orders update failed:', e.message); }

        // 4. OrderItems
        try {
            await sequelize.query(`ALTER TABLE "OrderItems" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(10, 2);`);
            await sequelize.query(`ALTER TABLE "OrderItems" ADD COLUMN IF NOT EXISTS "netAmount" DECIMAL(10, 2);`);
            await sequelize.query(`COMMENT ON COLUMN "OrderItems"."netAmount" IS 'Total including Tax';`);
            console.log('OrderItems updated.');
        } catch (e) { console.error('OrderItems update failed:', e.message); }

        // 5. Invoices
        try {
            await sequelize.query(`ALTER TABLE "Invoices" ADD COLUMN IF NOT EXISTS "invoiceDate" DATE;`);
            console.log('Invoices updated.');
        } catch (e) { console.error('Invoices update failed:', e.message); }

        // 6. Payments
        try {
            await sequelize.query(`ALTER TABLE "Payments" ADD COLUMN IF NOT EXISTS "paymentReference" VARCHAR(255);`);
            await sequelize.query(`COMMENT ON COLUMN "Payments"."paymentReference" IS 'Cheque No, UPI Ref, etc.';`);
            console.log('Payments updated.');
        } catch (e) { console.error('Payments update failed:', e.message); }

        process.exit(0);
    } catch (error) {
        console.error('Migration Error:', error);
        process.exit(1);
    }
}

migrate();
