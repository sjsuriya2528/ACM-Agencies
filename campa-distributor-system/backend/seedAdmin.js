const { User, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        const adminEmail = 'admin@campa.com';
        const existingAdmin = await User.findOne({ where: { email: adminEmail } });

        if (existingAdmin) {
            console.log('Admin user already exists.');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isActive: true,
            });
            console.log('Admin user created successfully.');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
