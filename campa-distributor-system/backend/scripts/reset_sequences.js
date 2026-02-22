const { sequelize } = require('../models');
const dotenv = require('dotenv');
dotenv.config();

async function resetSequences() {
    try {
        console.log('🚀 Resetting database sequences...');
        const tables = [
            { table: 'Orders', seq: 'Orders_id_seq' },
            { table: 'Invoices', seq: 'Invoices_id_seq' },
            { table: 'Payments', seq: 'Payments_id_seq' },
            { table: 'OrderItems', seq: 'OrderItems_id_seq' },
            { table: 'Deliveries', seq: 'Deliveries_id_seq' }
        ];

        for (const item of tables) {
            const [result] = await sequelize.query(`SELECT MAX(id) FROM "${item.table}"`);
            const maxId = result[0].max || 0;

            if (maxId === 0) {
                // For empty tables, set to 1 and is_called = false so next value is 1
                await sequelize.query(`SELECT setval('"${item.seq}"', 1, false)`);
            } else {
                await sequelize.query(`SELECT setval('"${item.seq}"', ${maxId})`);
            }
            console.log(`✅ Reset ${item.seq} to ${maxId === 0 ? '1 (is_called=false)' : maxId}`);
        }

    } catch (error) {
        console.error('❌ Error resetting sequences:', error);
    } finally {
        process.exit();
    }
}

resetSequences();
