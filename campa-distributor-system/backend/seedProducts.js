const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
});

const Product = require('./models/product')(sequelize, DataTypes);

const seedProducts = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        // Sync model to ensure new column exists (safe option, won't drop data)
        await Product.sync({ alter: true });

        const products = [
            // 200ml Bottles (Usually 24 or 30 per crate)
            { name: 'Campa Cola 200ml', sku: 'CAMPA-COLA-200', price: 10.00, stockQuantity: 1000, bottlesPerCrate: 24 },
            { name: 'Campa Orange 200ml', sku: 'CAMPA-ORG-200', price: 10.00, stockQuantity: 1000, bottlesPerCrate: 24 },
            { name: 'Campa Lemon 200ml', sku: 'CAMPA-LEM-200', price: 10.00, stockQuantity: 1000, bottlesPerCrate: 24 },
            { name: 'Campa Jeera 200ml', sku: 'CAMPA-JRA-200', price: 10.00, stockQuantity: 1000, bottlesPerCrate: 24 },
            { name: 'Campa Pop 200ml', sku: 'CAMPA-POP-200', price: 10.00, stockQuantity: 1000, bottlesPerCrate: 24 },

            // 500ml Bottles (Usually 24 per crate)
            { name: 'Campa Cola 500ml', sku: 'CAMPA-COLA-500', price: 20.00, stockQuantity: 500, bottlesPerCrate: 24 },
            { name: 'Campa Orange 500ml', sku: 'CAMPA-ORG-500', price: 20.00, stockQuantity: 500, bottlesPerCrate: 24 },
            { name: 'Campa Lemon 500ml', sku: 'CAMPA-LEM-500', price: 20.00, stockQuantity: 500, bottlesPerCrate: 24 },

            // 600ml Bottles (Usually 24 per crate)
            { name: 'Campa Cola 600ml', sku: 'CAMPA-COLA-600', price: 25.00, stockQuantity: 500, bottlesPerCrate: 24 },

            // 1L Bottles (Usually 12 or 15 per crate)
            { name: 'Campa Cola 1L', sku: 'CAMPA-COLA-1L', price: 40.00, stockQuantity: 200, bottlesPerCrate: 12 },

            // 2L Bottles (Usually 9 per crate)
            { name: 'Campa Cola 2L', sku: 'CAMPA-COLA-2L', price: 80.00, stockQuantity: 100, bottlesPerCrate: 9 },
            { name: 'Campa Orange 2L', sku: 'CAMPA-ORG-2L', price: 80.00, stockQuantity: 100, bottlesPerCrate: 9 },
        ];

        for (const product of products) {
            const existing = await Product.findOne({ where: { sku: product.sku } });
            if (existing) {
                // Update existing product to have correct bottlesPerCrate
                await existing.update(product);
                console.log(`Updated: ${product.name}`);
            } else {
                await Product.create(product);
                console.log(`Created: ${product.name}`);
            }
        }

        console.log('Product seeding completed!');
        process.exit();
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
};

seedProducts();
