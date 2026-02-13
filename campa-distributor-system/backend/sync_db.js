const db = require('./models');

async function syncDatabase() {
    console.log('🔄 Connecting to Supabase and syncing tables...');
    try {
        // Force: false creates tables if they don't exist, but doesn't drop them.
        await db.sequelize.sync({ force: false });
        console.log('✅ Database synced successfully!');
        console.log('👉 You should now see tables in your Supabase Dashboard.');
    } catch (error) {
        console.error('❌ Error syncing database:', error);
    } finally {
        await db.sequelize.close();
    }
}

syncDatabase();
