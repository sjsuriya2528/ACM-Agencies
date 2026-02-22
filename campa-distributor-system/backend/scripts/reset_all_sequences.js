const { sequelize } = require('../models');

async function resetAllSequences() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const [tables] = await sequelize.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        for (const table of tables) {
            const tableName = table.table_name;

            // Check if sequence exists for this table (standard naming: TableName_id_seq)
            const sequenceName = `"${tableName}_id_seq"`;

            try {
                // Check if the table has an 'id' column
                const [hasId] = await sequelize.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '${tableName}' AND column_name = 'id'
                `);

                if (hasId.length > 0) {
                    console.log(`Resetting sequence for ${tableName}...`);
                    await sequelize.query(`
                        SELECT setval('${sequenceName}', COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1, false);
                    `);
                    console.log(`Successfully reset sequence for ${tableName}.`);
                }
            } catch (err) {
                // If sequence doesn't exist or other error, just skip
                // console.log(`Skipping ${tableName}: ${err.message}`);
            }
        }

        console.log('All sequences reset successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting sequences:', error);
        process.exit(1);
    }
}

resetAllSequences();
