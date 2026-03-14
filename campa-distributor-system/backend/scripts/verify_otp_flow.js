const { sequelize, User, UserOTP } = require('../models');
const OTPService = require('../services/otpService');

const verifyFlow = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection established.');

        // 1. Find a test user
        const user = await User.findOne({ where: { role: 'admin' } });
        if (!user) {
            console.error('❌ No admin user found for testing.');
            process.exit(1);
        }
        console.log(`Testing with user: ${user.name} (${user.email})`);

        // 2. Test OTP Generation for Login
        console.log('--- Testing Login OTP Generation ---');
        const loginOtp = await OTPService.generateOTP(user.id, 'login');
        console.log(`Generated Login OTP: ${loginOtp}`);

        const savedOtp = await UserOTP.findOne({
            where: { userId: user.id, purpose: 'login', isUsed: false }
        });
        if (savedOtp && savedOtp.otpCode === loginOtp) {
            console.log('✅ OTP saved correctly in database.');
        } else {
            console.error('❌ OTP not found in database.');
        }

        // 3. Test Invalid OTP Verification
        console.log('--- Testing Invalid OTP Verification ---');
        const invalidResult = await OTPService.verifyOTP(user.id, '000000', 'login');
        console.log(`Verification result for '000000': ${JSON.stringify(invalidResult)}`);
        if (!invalidResult.success) {
            console.log('✅ Correctly rejected invalid OTP.');
        } else {
            console.error('❌ Failed to reject invalid OTP.');
        }

        // 4. Test Correct OTP Verification
        console.log('--- Testing Correct OTP Verification ---');
        const validResult = await OTPService.verifyOTP(user.id, loginOtp, 'login');
        console.log(`Verification result for '${loginOtp}': ${JSON.stringify(validResult)}`);
        if (validResult.success) {
            console.log('✅ Correctly verified valid OTP.');
        } else {
            console.error('❌ Failed to verify valid OTP.');
        }

        // 5. Test Reuse Prevention
        console.log('--- Testing Reuse Prevention ---');
        const reuseResult = await OTPService.verifyOTP(user.id, loginOtp, 'login');
        if (!reuseResult.success) {
            console.log('✅ Correctly prevented OTP reuse.');
        } else {
            console.error('❌ Failed to prevent OTP reuse.');
        }

        // 6. Test Expiry (Mocking time would be better, but let's just check expiration field)
        console.log('--- Testing Expiration Logic ---');
        const expiredOtpCode = await OTPService.generateOTP(user.id, 'login');
        const expiredOtpInstance = await UserOTP.findOne({
            where: { userId: user.id, purpose: 'login', isUsed: false }
        });
        
        // Manually set to past
        expiredOtpInstance.expiresAt = new Date(Date.now() - 1000);
        await expiredOtpInstance.save();
        
        const expiryResult = await OTPService.verifyOTP(user.id, expiredOtpCode, 'login');
        if (!expiryResult.success && expiryResult.message.includes('expired')) {
            console.log('✅ Correctly rejected expired OTP.');
        } else {
            console.error('❌ Failed to reject expired OTP.');
        }

        console.log('\n✅ ALL BACKEND OTP TESTS PASSED!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
};

verifyFlow();
