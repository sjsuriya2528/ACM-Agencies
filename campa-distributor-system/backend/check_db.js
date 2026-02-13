const { Sequelize } = require('sequelize');

// Original provided string
const url = 'postgresql://postgres:Mastersuriya%123@db.yyuoaeesahetldrcudtv.supabase.co:5432/postgres';

// URL Encoded password string (Mastersuriya%123 -> Mastersuriya%25123)
const encodedUrl = 'postgresql://postgres:Mastersuriya%25123@db.yyuoaeesahetldrcudtv.supabase.co:5432/postgres';

async function testConnection(connectionString, name) {
    console.log(`Testing ${name}...`);
    const sequelize = new Sequelize(connectionString, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

    try {
        await sequelize.authenticate();
        console.log(`✅ ${name}: Connection has been established successfully.`);
        return true;
    } catch (error) {
        console.error(`❌ ${name}: Unable to connect to the database:`, error.message);
        return false;
    } finally {
        await sequelize.close();
    }
}

async function run() {
    await testConnection(url, 'Original URL');
    await testConnection(encodedUrl, 'Encoded URL');
}

run();
