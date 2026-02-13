const { User, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');

        const users = [
            { name: 'Sales Rep', email: 'rep@campa.com', role: 'sales_rep' },
            { name: 'Driver', email: 'driver@campa.com', role: 'driver' },
            { name: 'Collector', email: 'collector@campa.com', role: 'collection_agent' },
            { name: 'Admin User', email: 'admin@campa.com', role: 'admin' }, // Ensure admin exists
        ];

        for (const user of users) {
            const existingUser = await User.findOne({ where: { email: user.email } });
            if (!existingUser) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('password123', salt); // Default password for all

                await User.create({
                    name: user.name,
                    email: user.email,
                    password: hashedPassword,
                    role: user.role,
                    isActive: true,
                });
                console.log(`User created: \${user.email} (\${user.role})`);
            } else {
                console.log(`User already exists: \${user.email}`);
            }
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
