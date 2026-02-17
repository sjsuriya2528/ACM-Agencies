const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

// Use DATABASE_URL or construct from env vars
const dbUrl = process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log('Connecting to database...');

const sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false
});

const alterColumn = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Raw query to alter the column type
        await sequelize.query('ALTER TABLE "Products" ALTER COLUMN "price" TYPE DECIMAL(10, 4);');

        console.log('Successfully altered price column to DECIMAL(10, 4)');
        process.exit(0);
    } catch (error) {
        console.error('Failed to alter column:', error);
        process.exit(1);
    }
};

alterColumn();
