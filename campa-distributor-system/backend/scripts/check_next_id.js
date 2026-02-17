const { sequelize } = require('../models');

async function checkNextId() {
    try {
        const [results] = await sequelize.query("SELECT last_value, is_called FROM \"Orders_id_seq\"");
        const { last_value, is_called } = results[0];
        const nextId = is_called ? parseInt(last_value) + 1 : parseInt(last_value);
        console.log(`Current sequence value: ${last_value}`);
        console.log(`The next Order ID will be: ${nextId}`);
    } catch (error) {
        console.error('Error checking sequence:', error);
    } finally {
        process.exit();
    }
}

checkNextId();
