import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { User, Mail, Lock, ShieldCheck, Key, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

const Profile = () => {
    const { user } = useContext(AuthContext);
    const [step, setStep] = useState('profile'); // profile, send_otp, verify_otp, new_password
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/send-password-otp');
            setMessage('OTP sent to your email.');
            setStep('verify_otp');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter 6-digit OTP');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await api.post('/auth/verify-password-otp', { otpCode });
            setStep('new_password');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await api.post('/auth/update-password', { newPassword });
            setMessage('Password updated successfully!');
            setStep('profile');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
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
        <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-700 transition-colors duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">User Profile</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm uppercase tracking-widest font-medium">Manage your account settings</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User Info Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center text-center transition-colors">
                        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                            <User size={48} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{user?.email}</p>
                        <div className="inline-flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                            {user?.role?.replace('_', ' ')}
                        </div>
                    </div>
                </div>

                {/* Main Action Area */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <Lock size={20} className="text-slate-600 dark:text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security Settings</h3>
                        </div>

                        {message && (
                            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in slide-in-from-top-2">
                                <CheckCircle2 size={18} />
                                <span className="text-sm font-medium">{message}</span>
                            </div>
                        )}

                        {error && (
                            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle size={18} />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {step === 'profile' && (
                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Change Password</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your password to keep your account secure.</p>
                                    </div>
                                    <button
                                        onClick={() => setStep('send_otp')}
                                        className="bg-slate-900 dark:bg-blue-600 hover:bg-slate-950 dark:hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md active:scale-95"
                                    >
                                        Update
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'send_otp' && (
                            <div className="text-center space-y-6 py-4">
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 text-sm inline-block mx-auto mb-4">
                                    <ShieldCheck className="mx-auto mb-2" size={32} />
                                    <p className="font-medium text-slate-800 dark:text-white">Verification Required</p>
                                    <p className="opacity-80 text-slate-600 dark:text-slate-400">We'll send an OTP to your email for security.</p>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <button
                                        onClick={handleSendOTP}
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 rounded-2xl transition-all shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 flex items-center gap-2"
                                    >
                                        {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Send OTP via Email'}
                                    </button>
                                    <button onClick={() => setStep('profile')} className="text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-white transition-colors">Cancel</button>
                                </div>
                            </div>
                        )}

                        {step === 'verify_otp' && (
                            <div className="space-y-8 py-4">
                                <div className="text-center space-y-2">
                                    <h4 className="font-bold text-slate-800 dark:text-white">Enter OTP</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Sent to {user?.email}</p>
                                </div>

                                <div className="flex justify-center gap-2">
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            id={`otp-${idx}`}
                                            type="text"
                                            className="w-12 h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-center text-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <button
                                        onClick={handleVerifyOTP}
                                        disabled={loading || otp.join('').length !== 6}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Verify and Continue'}
                                    </button>
                                    <button onClick={() => setStep('send_otp')} className="text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-white transition-colors">Resend OTP</button>
                                </div>
                            </div>
                        )}

                        {step === 'new_password' && (
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">New Password</label>
                                    <div className="relative group">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Min 6 characters"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Confirm New Password</label>
                                    <div className="relative group">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                        <input
                                            type="password"
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Repeat password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpdatePassword}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <RefreshCw className="animate-spin" size={20} /> : 'Update Password'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
