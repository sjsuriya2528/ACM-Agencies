import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

const VerifyOtp = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [timer, setTimer] = useState(120); // 2 minutes
    const { verifyOTP } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const inputRefs = useRef([]);

    const { userId, email, debugOTP } = location.state || {};

    useEffect(() => {
        if (!userId) {
            navigate('/login');
        }
    }, [userId, navigate]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(timer - 1), 1000);
            return () => clearInterval(interval);
        } else {
            setResendDisabled(false);
        }
    }, [timer]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        const pasteData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d+$/.test(pasteData)) {
            const newOtp = [...otp];
            pasteData.split('').forEach((char, i) => {
                if (i < 6) newOtp[i] = char;
            });
            setOtp(newOtp);
            if (pasteData.length === 6) {
                inputRefs.current[5].focus();
            } else {
                inputRefs.current[pasteData.length].focus();
            }
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setError('');
        setLoading(true);
        const result = await verifyOTP(userId, otpCode);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    const handleResend = () => {
        // Implementation for resend would go here
        // For now just reset timer
        setTimer(120);
        setResendDisabled(true);
        setError('A new OTP has been sent to your email.');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!userId) return null;

    return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md animate-scale-in z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 mb-6 shadow-2xl w-20 h-20">
                        <ShieldCheck className="text-blue-400 w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Security Verification</h2>
                    <p className="text-slate-400 mt-2">Enter the verification code sent to <br/><span className="text-blue-400 font-medium">{email}</span></p>
                </div>

                <div className="bg-white/10 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                    {debugOTP && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-3 rounded-xl mb-6 text-xs text-center border-dashed">
                            <span className="opacity-60">DEBUG OTP:</span> <span className="font-mono font-bold tracking-widest">{debugOTP}</span>
                        </div>
                    )}

                    {error && (
                        <div className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-head-shake ${error.includes('sent') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200' : 'bg-rose-500/10 border border-rose-500/20 text-rose-200'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${error.includes('sent') ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-between gap-2">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    className="w-full h-14 bg-slate-900/50 border border-white/5 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    maxLength={1}
                                    value={data}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading || otp.join('').length !== 6}
                                className={`w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 group ${loading || otp.join('').length !== 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <RefreshCw size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 size={20} />
                                        Verify OTP
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                Back to Login
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-sm">
                            Didn't receive code?{' '}
                            {resendDisabled ? (
                                <span className="text-slate-500 font-medium">Resend in {formatTime(timer)}</span>
                            ) : (
                                <button
                                    onClick={handleResend}
                                    className="text-blue-400 font-bold hover:underline"
                                >
                                    Resend Now
                                </button>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
