const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
});

const Retailer = require('./models/Retailer')(sequelize, DataTypes);

const checkRetailers = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        const retailers = await Retailer.findAll({
            order: [['createdAt', 'DESC']]
        });

        console.log('\n--- Retailer List ---');
        console.log(`Total Retailers: ${retailers.length}`);

        if (retailers.length === 0) {
            console.log('No retailers found.');
        } else {
            retailers.forEach(r => {
                console.log(`\nID: ${r.id}`);
                console.log(`Shop Name: ${r.shopName}`);
                console.log(`Owner: ${r.ownerName}`);
                console.log(`Location: ${r.gpsLatitude}, ${r.gpsLongitude}`);
                console.log(`Created At: ${r.createdAt}`);
            });
        }
        console.log('\n---------------------\n');

        process.exit();
    } catch (error) {
        console.error('Error fetching retailers:', error);
        process.exit(1);
    }
};

checkRetailers();
