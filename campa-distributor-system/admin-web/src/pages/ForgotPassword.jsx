import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { Mail, Lock, Key, RefreshCw, CheckCircle2, AlertCircle, ChevronLeft, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState(null);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await axios.post('/auth/forgot-password-otp', { email });
            setUserId(response.data.userId);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Email not found or server error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter 6-digit OTP');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await axios.post('/auth/reset-password', {
                userId,
                otpCode,
                newPassword
            });
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-mesh flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
            <div className="absolute top-8 right-8 z-50">
                <ThemeToggle />
            </div>
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md animate-scale-in z-10 transition-all duration-500">
                <div className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
                    <div className="mb-6 relative z-10">
                        <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-white transition-colors text-sm mb-6 group">
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to login
                        </Link>
                        <h2 className="text-3xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">Reset Password</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Follow the steps to recover your account</p>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-200 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-head-shake">
                            <AlertCircle size={18} className="text-rose-600 dark:text-rose-500" />
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-200 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-500" />
                            {message}
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Account Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Send Verification Code'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <ShieldCheck className="mx-auto mb-2 text-blue-400" size={32} />
                                <p className="text-sm text-slate-300">We've sent a 6-digit code to <br /><strong className="text-white">{email}</strong></p>
                            </div>

                            <div className="flex justify-between gap-2">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-${idx}`}
                                        type="text"
                                        className="w-12 h-14 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-center text-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    />
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-500/50 outline-none"
                                            placeholder="Minimum 6 characters"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-500/50 outline-none"
                                            placeholder="Repeat password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleVerifyAndReset}
                                disabled={loading || otp.join('').length !== 6}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Reset Password'}
                            </button>

                            <button
                                onClick={() => setStep(1)}
                                className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
                            >
                                Send code to different email
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
