const { sequelize } = require('./models');

const syncDatabase = async () => {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('Connection established successfully.');

        console.log('Syncing database with { alter: true }...');
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully on: ' + new Date().toISOString());

        process.exit(0);
    } catch (error) {
        console.error('Unable to connect or sync to the database:', error);
        process.exit(1);
    }
};

syncDatabase();
