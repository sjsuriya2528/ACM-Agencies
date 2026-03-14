const { sequelize, User, UserOTP } = require('./models');

const syncTargeted = async () => {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('Connection established successfully.');

        console.log('Syncing User and UserOTP models...');
        // We sync only these models to avoid issues in other tables
        await User.sync({ alter: true });
        await UserOTP.sync({ alter: true });
        
        console.log('Targeted sync successful!');
        process.exit(0);
    } catch (error) {
        console.error('Targeted sync failed:', error);
        process.exit(1);
    }
};

syncTargeted();
