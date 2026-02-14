const { sequelize, User } = require('./models');

async function debugLogin() {
    try {
        await sequelize.authenticate();
        console.log('DB Connection: Success');

        const users = await User.findAll({
            attributes: ['id', 'email', 'role', 'isActive']
        });

        console.log('---------------------------------------------------');
        console.log(`Found ${users.length} users in the database:`);
        users.forEach(u => {
            console.log(`ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | Active: ${u.isActive}`);
        });
        console.log('---------------------------------------------------');

        if (users.length === 0) {
            console.log('WARNING: No users found! You need to run the seed script.');
        }

    } catch (error) {
        console.error('DB Connection Failed:', error.message);
    } finally {
        process.exit();
    }
}

debugLogin();
