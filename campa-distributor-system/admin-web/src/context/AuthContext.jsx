import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password }, {
                headers: { 'x-loading-term': 'Authenticating' }
            });
            const data = response.data;

            if (data.role !== 'admin') {
                return { success: false, message: "Access Denied: Admins only" };
            }

            localStorage.setItem('adminUser', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return { success: false, message: error.response?.data?.message || "Login failed" };
        }
    };

    const verifyOTP = async (userId, otpCode) => {
        try {
            const response = await api.post('/auth/verify-otp', { userId, otpCode }, {
                headers: { 'x-loading-term': 'Verifying OTP' }
            });
            const userData = response.data;

            if (userData.role !== 'admin') {
                return { success: false, message: "Access Denied: Admins only" };
            }

            localStorage.setItem('adminUser', JSON.stringify(userData));
            setUser(userData);
            return { success: true };
        } catch (error) {
            console.error("OTP verification failed", error);
            return { success: false, message: error.response?.data?.message || "Invalid OTP" };
        }
    };

    const logout = () => {
        localStorage.removeItem('adminUser');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, verifyOTP, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
