const { sequelize } = require('./models');

async function checkSchema() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');
        const [retailerCols] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Retailers';");
        console.log('Columns in Retailers:', retailerCols.map(c => c.column_name));

        const [orderCols] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Orders';");
        console.log('Columns in Orders:', orderCols.map(c => c.column_name));

        const [productCols] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Products';");
        console.log('Columns in Products:', productCols.map(c => c.column_name));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
