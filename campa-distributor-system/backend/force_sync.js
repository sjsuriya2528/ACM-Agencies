const { sequelize } = require('./models');

async function syncSchema() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected. Syncing schema...');
        await sequelize.sync({ alter: true });
        console.log('Schema sync complete.');

        // Verify columns
        const [retailerCols] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Retailers';");
        console.log('Retailers columns:', retailerCols.map(c => c.column_name).filter(c => ['externalId', 'routeName'].includes(c)));

        const [productCols] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Products';");
        console.log('Products columns:', productCols.map(c => c.column_name).filter(c => ['hsnCode'].includes(c)));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

syncSchema();
