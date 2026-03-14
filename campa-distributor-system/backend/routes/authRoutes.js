const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getUserProfile,
    sendPasswordOTP,
    verifyPasswordOTP,
    updatePassword,
    forgotPasswordOTP,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);

// Public Password Reset Flow
router.post('/forgot-password-otp', forgotPasswordOTP);
router.post('/reset-password', resetPassword);

// Internal Password Change Flow (Logged-in)
router.post('/send-password-otp', protect, sendPasswordOTP);
router.post('/verify-password-otp', protect, verifyPasswordOTP);
router.post('/update-password', protect, updatePassword);

module.exports = router;
