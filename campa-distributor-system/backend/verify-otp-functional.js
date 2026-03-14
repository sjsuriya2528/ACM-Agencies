const { sequelize, User, UserOTP } = require('./models');

const verifyFunctional = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection established.');

        // Find a user
        const user = await User.findOne();
        if (!user) {
            console.log('⚠️ No users found in database. Cannot test association.');
            process.exit(0);
        }

        console.log(`Testing with user: ${user.name} (${user.id})`);

        // Create an OTP
        const otp = await UserOTP.create({
            userId: user.id,
            otpCode: '123456',
            purpose: 'verification_test',
            expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        });

        console.log('✅ OTP created:', otp.toJSON());

        // Find the OTP including user
        const foundOtp = await UserOTP.findByPk(otp.id, {
            include: [{ model: User, as: 'user' }]
        });

        if (foundOtp && foundOtp.user.id === user.id) {
            console.log('✅ OTP found with associated user!');
        } else {
            console.error('❌ OTP found but association failed.');
        }

        // Cleanup
        await otp.destroy();
        console.log('✅ Test OTP cleaned up.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Functional verification failed:', error);
        process.exit(1);
    }
};

verifyFunctional();
