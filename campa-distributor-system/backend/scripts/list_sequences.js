const { sequelize } = require('../models');
const dotenv = require('dotenv');
dotenv.config();

async function listSequences() {
    try {
        console.log('🚀 Fetching sequence names from database...');
        const [results] = await sequelize.query("SELECT relname FROM pg_class WHERE relkind = 'S'");
        console.log('Found sequences:');
        results.forEach(r => console.log(` - ${r.relname}`));
    } catch (error) {
        console.error('❌ Error listing sequences:', error);
    } finally {
        process.exit();
    }
}

listSequences();
