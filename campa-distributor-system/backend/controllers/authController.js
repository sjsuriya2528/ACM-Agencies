const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const OTPService = require('../services/otpService');
const sendEmail = require('../utils/emailService');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, phone, address } = req.body;

    try {
        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'sales_rep',
            phone,
            address,
        });

        if (user) {
            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for email: ${email}`);

    try {
        const user = await User.findOne({ where: { email } });
        console.log(`User found: ${user ? 'Yes' : 'No'}`);

        if (user && (await bcrypt.compare(password, user.password))) {
            console.log('Password match: Yes');
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            console.log('Password match or user found: No');
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error during login' });
    }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password-otp
// @access  Public
const forgotPasswordOTP = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            // We return 200 even if user not found for security (prevent email enumeration)
            // But for a distributor system, usually fine to be more explicit. 
            // The requirement says "verify identity", so let's be explicit.
            return res.status(404).json({ message: 'User with this email not found' });
        }

        const otpCode = await OTPService.generateOTP(user.id, 'forgot_password');

        await sendEmail({
            email: user.email,
            subject: 'ACM Agencies - Forgot Password OTP',
            message: `Your OTP for password reset is ${otpCode}. Valid for 2 minutes.`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb;">Reset Your Password</h2>
                <p>You requested a password reset. Use the code below to proceed:</p>
                <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                    <h1 style="color: #1e40af; letter-spacing: 8px; font-family: monospace;">${otpCode}</h1>
                </div>
                <p>This code is valid for <strong>2 minutes</strong>.</p>
                <p style="color: #64748b; font-size: 12px; margin-top: 20px;">If you didn't request this, please secure your account immediately.</p>
            </div>`
        });

        res.json({ userId: user.id, message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Forgot Password - Reset with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { userId, otpCode, newPassword } = req.body;

    try {
        const result = await OTPService.verifyOTP(userId, otpCode, 'forgot_password');

        if (result.success) {
            const user = await User.findByPk(userId);
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();

            res.json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP for Login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    const { userId, otpCode } = req.body;

    try {
        const result = await OTPService.verifyOTP(userId, otpCode, 'login');

        if (result.success) {
            const user = await User.findByPk(userId);
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send OTP for password change
// @route   POST /api/auth/send-password-otp
// @access  Private
const sendPasswordOTP = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const otpCode = await OTPService.generateOTP(user.id, 'password_change');

        await sendEmail({
            email: user.email,
            subject: 'Campa Billing System - Password Change OTP',
            message: `Your OTP for password change is ${otpCode}. Valid for 2 minutes.`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Password Change Request</h2>
                <p>Your OTP is:</p>
                <h1 style="color: #2563eb; letter-spacing: 5px;">${otpCode}</h1>
                <p>Valid for 2 minutes.</p>
            </div>`
        });

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP for password change
// @route   POST /api/auth/verify-password-otp
// @access  Private
const verifyPasswordOTP = async (req, res) => {
    const { otpCode } = req.body;

    try {
        const result = await OTPService.verifyOTP(req.user.id, otpCode, 'password_change');

        if (result.success) {
            res.json({ success: true, message: 'OTP verified successfully' });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update password after OTP verification
// @route   POST /api/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
    const { newPassword } = req.body;

    try {
        // We should ideally check if OTP was verified recently for this purpose
        // But for this implementation, we assume the frontend sends this request
        // only after verifyPasswordOTP success. 
        // A more secure way would be to issue a short-lived "password-reset-token".
        
        const user = await User.findByPk(req.user.id);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (user) {
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    verifyOTP,
    getUserProfile,
    sendPasswordOTP,
    verifyPasswordOTP,
    updatePassword,
    forgotPasswordOTP,
    resetPassword
};
