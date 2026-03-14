const { sequelize, User, UserOTP } = require('../models');
const OTPService = require('../services/otpService');

const verifyForgotPasswordFlow = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection established.');

        const email = 'sjsuriya251106@gmail.com';
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            console.error('❌ User not found for testing.');
            process.exit(1);
        }

        console.log(`\n1. Testing Forgot Password OTP Generation for user ${user.id}...`);
        const otpCode = await OTPService.generateOTP(user.id, 'forgot_password');
        console.log(`✅ Generated OTP: ${otpCode}`);

        const otpInDb = await UserOTP.findOne({
            where: { userId: user.id, otpCode, purpose: 'forgot_password', isUsed: false }
        });

        if (otpInDb) {
            console.log('✅ OTP successfully saved in database.');
        } else {
            console.error('❌ OTP not found in database.');
            process.exit(1);
        }

        console.log('\n2. Testing OTP Verification...');
        const verifyResult = await OTPService.verifyOTP(user.id, otpCode, 'forgot_password');
        if (verifyResult.success) {
            console.log('✅ OTP verified successfully.');
        } else {
            console.error('❌ OTP verification failed:', verifyResult.message);
            process.exit(1);
        }

        console.log('\n✅ FORGOT PASSWORD BACKEND LOGIC VERIFIED!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification Error:', error);
        process.exit(1);
    }
};

verifyForgotPasswordFlow();
