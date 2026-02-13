const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const db = require('./models');

dotenv.config();

const updateSchema = async () => {
    try {
        console.log('Authenticating...');
        await db.sequelize.authenticate();
        console.log('Database connected.');

        console.log('Syncing schema (alter: true)...');
        await db.sequelize.sync({ alter: true });
        console.log('Schema updated successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
};

updateSchema();
