import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { Mail, Lock, Key, RefreshCw, CheckCircle2, AlertCircle, ChevronLeft, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP/Reset
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
            <div className="absolute top-8 right-8 z-50">
                <ThemeToggle />
            </div>
            {/* Ambient Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[150px] opacity-20 dark:opacity-100"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[150px] opacity-20 dark:opacity-100"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.01)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]"></div>
            </div>

            <div className="w-full max-w-md animate-scale-in z-10 transition-all duration-500">
                <div className="bg-white dark:bg-white/5 dark:backdrop-blur-3xl border border-slate-200 dark:border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_4px_15px_rgba(37,99,235,0.3)]"></div>
                    
                    <div className="mb-10 relative z-10">
                        <Link to="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] mb-8 group/back cursor-pointer">
                            <ChevronLeft size={16} className="group-hover/back:-translate-x-1 transition-transform" strokeWidth={3} />
                            Abort Recovery
                        </Link>
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white leading-tight">Reset Account Access</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Reset Your Password</p>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-5 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-4 animate-head-shake">
                            <AlertCircle size={20} className="text-rose-600 dark:text-rose-500" />
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-5 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-4 animate-in fade-in zoom-in-95">
                            <CheckCircle2 size={20} className="text-emerald-500" />
                            {message}
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-8 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Verification Channel (Email)</label>
                                <div className="relative group/input">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-blue-400 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800 font-black tracking-tight"
                                        placeholder="operator@acm.systems"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 font-black py-5 rounded-[1.5rem] shadow-2xl dark:shadow-white/5 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs border border-slate-800 dark:border-white"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={22} strokeWidth={3} /> : 'Request Authorization Code'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 relative z-10">
                            <div className="text-center p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/20 relative overflow-hidden group/notice">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 blur-2xl transition-all"></div>
                                <ShieldCheck className="mx-auto mb-3 text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]" size={32} />
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
                                    Code dispatched to <br />
                                    <span className="text-white italic tracking-normal lowercase font-bold">{email}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-6 gap-2">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`otp-${idx}`}
                                        type="text"
                                        className="w-full h-14 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-center text-xl font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none shadow-inner uppercase italic"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                    />
                                ))}
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">New Password</label>
                                    <div className="relative group/input">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-blue-400 transition-colors" size={20} />
                                        <input
                                            type="password"
                                            className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800 font-black tracking-tight"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Confirm Password</label>
                                    <div className="relative group/input">
                                        <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-blue-400 transition-colors" size={20} />
                                        <input
                                            type="password"
                                            className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800 font-black tracking-tight"
                                            placeholder="••••••••"
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
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 font-black py-5 rounded-[1.5rem] shadow-2xl dark:shadow-white/5 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs border border-slate-800 dark:border-white"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={22} strokeWidth={3} /> : 'Reset Password'}
                            </button>

                            <button
                                onClick={() => setStep(1)}
                                className="w-full text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center justify-center gap-2 group"
                            >
                                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
