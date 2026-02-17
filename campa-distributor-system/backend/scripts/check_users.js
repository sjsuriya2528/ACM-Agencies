
const { User, sequelize } = require('../models');

async function checkUsers() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role']
        });

        console.log('--- User List ---');
        users.forEach(user => {
            console.log(`ID: ${user.id} | Name: ${user.name} | Email: ${user.email} | Role: '${user.role}'`);
        });
        console.log('-----------------');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkUsers();
