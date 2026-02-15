const { sequelize } = require('../models');

const syncDb = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync database (alter: true updates the schema without dropping data)
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');

        process.exit(0);
    } catch (e) {
        console.error('Error syncing database:', e);
        process.exit(1);
    }
}

syncDb();
