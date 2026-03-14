const { UserOTP } = require('../models');
const { Op } = require('sequelize');

/**
 * Generate a 6-digit random OTP
 */
const generateOTPCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Service to handle OTP operations
 */
const OTPService = {
    /**
     * Generate and store OTP for a user
     */
    generateOTP: async (userId, purpose) => {
        // Limit OTP generation: Delete any existing unused OTPs for this user and purpose
        await UserOTP.destroy({
            where: {
                userId,
                purpose,
                isUsed: false
            }
        });

        const otpCode = generateOTPCode();
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

        const otp = await UserOTP.create({
            userId,
            otpCode,
            purpose,
            expiresAt,
            attemptCount: 0,
            isUsed: false
        });

        return otpCode;
    },

    /**
     * Verify OTP
     */
    verifyOTP: async (userId, otpCode, purpose) => {
        const otpInstance = await UserOTP.findOne({
            where: {
                userId,
                purpose,
                isUsed: false,
                expiresAt: {
                    [Op.gt]: new Date()
                }
            },
            order: [['created_at', 'DESC']]
        });

        if (!otpInstance) {
            return { success: false, message: 'OTP expired or not found' };
        }

        if (otpInstance.attemptCount >= 3) {
            return { success: false, message: 'Maximum attempts reached' };
        }

        if (otpInstance.otpCode !== otpCode) {
            // Increment attempt count
            otpInstance.attemptCount += 1;
            await otpInstance.save();
            return { success: false, message: `Invalid OTP. ${3 - otpInstance.attemptCount} attempts remaining.` };
        }

        // Valid OTP
        otpInstance.isUsed = true;
        await otpInstance.save();

        return { success: true };
    }
};

module.exports = OTPService;
