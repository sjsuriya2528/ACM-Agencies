const { Product, sequelize } = require('../models');

const products = [
    { id: 1, name: '200ML ORANGE', groupName: 'ORANGE', price: 0, stockQuantity: 100 },
    { id: 2, name: '500ML ORANGE', groupName: 'ORANGE', price: 0, stockQuantity: 100 },
    { id: 3, name: '1L ORANGE', groupName: 'ORANGE', price: 0, stockQuantity: 100 },
    { id: 4, name: '2L ORANGE', groupName: 'ORANGE', price: 0, stockQuantity: 100 },
    { id: 6, name: '200 ML LEMON', groupName: 'LEMON', price: 0, stockQuantity: 100 },
    { id: 7, name: '500ML LEMON (24PCS)', groupName: 'LEMON', price: 0, stockQuantity: 100 },
    { id: 8, name: 'LEMON 1L (12 PCS)', groupName: 'LEMON', price: 0, stockQuantity: 100 },
    { id: 9, name: 'LEMON 2L (9PCS)', groupName: 'LEMON', price: 0, stockQuantity: 100 },
    { id: 10, name: 'LEMON TIN(24PCS)', groupName: 'LEMON', price: 0, stockQuantity: 100 },
    { id: 11, name: 'ORANGE TIN (24PCS)', groupName: 'ORANGE', price: 0, stockQuantity: 100 },
    { id: 12, name: 'COKE TIN(24PCS)', groupName: 'COKE', price: 0, stockQuantity: 100 },
    { id: 13, name: 'COKE 200ML(30PCS)', groupName: 'COKE', price: 0, stockQuantity: 100 },
    { id: 14, name: 'COKE 500ML(24PCS)', groupName: 'COKE', price: 0, stockQuantity: 100 },
    { id: 15, name: 'COKE 1L(12PCS)', groupName: 'COKE', price: 0, stockQuantity: 100 },
    { id: 16, name: 'COKE 2L(9PCS)', groupName: 'COKE', price: 0, stockQuantity: 100 },
    { id: 17, name: '200ML MANGO (30PCS)', groupName: 'MANGO', price: 0, stockQuantity: 100 },
    { id: 19, name: '150 ML MIXED FRUIT(30PCS)', groupName: 'MIXED FRUIT', price: 0, stockQuantity: 100 },
    { id: 20, name: 'POWER UP 200ML (30PCS)', groupName: 'POWER UP', price: 0, stockQuantity: 100 },
    { id: 21, name: 'POWER UP 1L(12PCS)', groupName: 'POWER UP', price: 0, stockQuantity: 100 },
    { id: 22, name: '150ML STRAWBERRY KICK(30PCS)', groupName: 'ENERGY DRINK', price: 0, stockQuantity: 100 },
    { id: 23, name: '250ML ENERGY BERRY KICK(30PCS)', groupName: 'ENERGY DRINK', price: 0, stockQuantity: 100 },
    { id: 24, name: 'SUNCRUSH ORANGE 200ML(24PCS)', groupName: 'SUNCRUSH', price: 0, stockQuantity: 100 },
    { id: 25, name: 'SUNCRUSH MANGO(24PCS)', groupName: 'SUNCRUSH', price: 0, stockQuantity: 100 },
    { id: 26, name: 'SUNCRUSH MIXED FRUIT (24PCS)', groupName: 'SUNCRUSH', price: 0, stockQuantity: 100 },
    { id: 27, name: 'CHOCO MILKSHAKE(30PCS)', groupName: 'MILKSHAKE', price: 0, stockQuantity: 100 },
    { id: 28, 'name': '750ml INDEPENDENCE WATER (15PCS)', groupName: 'INDEPENDENCE WATER', price: 0, stockQuantity: 100 },
    { id: 29, 'name': '1.5l INDEPENDENCE', groupName: 'INDEPENDENCE WATER', price: 0, stockQuantity: 100 },
    { id: 30, 'name': '1L a Sure water', groupName: 'A SURE WATER', price: 0, stockQuantity: 100 },
    { id: 31, 'name': '200ML PANNER SODA(30PCS)', groupName: 'PANNEER SODA', price: 0, stockQuantity: 100 },
    { id: 32, 'name': 'gluco energy cup', groupName: 'RASKIK GLUCO CUP', price: 0, stockQuantity: 100 },
    { id: 33, 'name': 'gluco nimbu paani', groupName: 'RASKIK GLUCO CUP', price: 0, stockQuantity: 100 },
    { id: 34, 'name': 'ENERGY GOLD TIN', groupName: 'ENERGY DRINK', price: 0, stockQuantity: 100 },
    { id: 35, 'name': '500ML MANGO', groupName: 'MANGO', price: 0, stockQuantity: 100 },
    { id: 36, 'name': '500ml panner soda', groupName: 'PANNEER SODA', price: 0, stockQuantity: 100 },
    { id: 37, 'name': 'Nimbu paani pet', groupName: 'RASKIK GLUCO CUP', price: 0, stockQuantity: 100 },
    { id: 38, 'name': '500ml soda', groupName: 'SODA', price: 0, stockQuantity: 100 },
    { id: 39, 'name': '2.25l lemon', groupName: 'LEMON', price: 0, stockQuantity: 100 },
    { id: 40, 'name': '2.25 orange', groupName: 'ORANGE', price: 0, stockQuantity: 100 },
    { id: 41, 'name': '2.25 coke', groupName: 'COKE', price: 0, stockQuantity: 100 },
    { id: 42, 'name': 'gluco energy pet', groupName: 'RASKIK GLUCO CUP', price: 0, stockQuantity: 100 },
    { id: 43, 'name': '150ml apple pet', groupName: 'MIXED FRUIT', price: 0, stockQuantity: 100 }
];

const seed = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Disable foreign key checks for truncation (PostgreSQL specific or general)
        // await sequelize.query('SET session_replication_role = "replica";'); // Might need this for Postgres if FKs block truncation

        console.log('Truncating Products table...');
        await Product.destroy({ truncate: true, cascade: true });

        console.log(`Seeding ${products.length} products...`);
        // Use individual creates to ensure ID is respected if bulkCreate behaves differently strictly
        // But let's try bulkCreate first with explicit IDs
        await Product.bulkCreate(products);

        console.log('Resetting ID sequence...');
        // Update sequence to max ID + 1
        await sequelize.query(`SELECT setval('"Products_id_seq"', (SELECT MAX(id) FROM "Products"));`);

        console.log('Product seeding completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Error seeding products:', e);
        process.exit(1);
    }
}

seed();
