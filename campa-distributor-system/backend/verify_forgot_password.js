const axios = require('axios');

const testForgotPassword = async () => {
    const baseURL = 'http://localhost:5000/api';
    const email = 'sjsuriya251106@gmail.com'; // Use the email from the screenshot

    try {
        console.log('1. Testing Forgot Password OTP Generation...');
        const response1 = await axios.post(`${baseURL}/auth/forgot-password-otp`, { email });
        console.log('✅ Response:', response1.data);
        const { userId } = response1.data;

        console.log('\n2. Testing Login flow (should work without OTP now)...');
        // Note: I don't have the password, but the user said they enter credentials to login.
        // If login returns 401 instead of 500/OTP, it means OTP flow is reverted.
        try {
            await axios.post(`${baseURL}/auth/login`, { email, password: 'wrongpassword' });
        } catch (loginErr) {
            if (loginErr.response?.status === 401) {
                console.log('✅ Login correctly returned 401 Unauthorized (Standard login behavior).');
            } else {
                console.log('❌ Login returned unexpected error:', loginErr.response?.status);
            }
        }

        console.log('\n✅ BACKEND VERIFICATION COMPLETE!');
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
};

testForgotPassword();
