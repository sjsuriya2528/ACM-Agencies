const { Product, sequelize } = require('./models');

const products = [
    { name: 'Campa Cola 200ml', sku: 'CC-200', price: 10.00, bottlesPerCrate: 30, stockQuantity: 1000 },
    { name: 'Campa Cola 500ml', sku: 'CC-500', price: 20.00, bottlesPerCrate: 24, stockQuantity: 1000 },
    { name: 'Campa Cola 2L', sku: 'CC-2000', price: 80.00, bottlesPerCrate: 9, stockQuantity: 500 },
    { name: 'Campa Orange 200ml', sku: 'CO-200', price: 10.00, bottlesPerCrate: 30, stockQuantity: 1000 },
    { name: 'Campa Orange 500ml', sku: 'CO-500', price: 20.00, bottlesPerCrate: 24, stockQuantity: 1000 },
    { name: 'Campa Orange 2L', sku: 'CO-2000', price: 80.00, bottlesPerCrate: 9, stockQuantity: 500 },
    { name: 'Campa Lemon 200ml', sku: 'CL-200', price: 10.00, bottlesPerCrate: 30, stockQuantity: 1000 },
    { name: 'Campa Lemon 500ml', sku: 'CL-500', price: 20.00, bottlesPerCrate: 24, stockQuantity: 1000 },
    { name: 'Campa Lemon 2L', sku: 'CL-2000', price: 80.00, bottlesPerCrate: 9, stockQuantity: 500 },
    { name: 'Campa Jeera 200ml', sku: 'CJ-200', price: 10.00, bottlesPerCrate: 30, stockQuantity: 1000 },
    { name: 'Campa Jeera 500ml', sku: 'CJ-500', price: 20.00, bottlesPerCrate: 24, stockQuantity: 1000 },
    { name: 'Campa Power Up 250ml', sku: 'CPU-250', price: 40.00, bottlesPerCrate: 24, stockQuantity: 1000 },
];

const seedProducts = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        await sequelize.sync();

        for (const p of products) {
            const [product, created] = await Product.findOrCreate({
                where: { sku: p.sku },
                defaults: p
            });
            if (created) {
                console.log(`Created: ${product.name}`);
            } else {
                console.log(`Exists: ${product.name}`);
            }
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedProducts();
