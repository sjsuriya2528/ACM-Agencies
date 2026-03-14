import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, LogIn, ShieldCheck, ChevronRight } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.message);
        }
    };



    return (
        <div className="min-h-screen bg-white dark:bg-mesh flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
            <div className="absolute top-8 right-8 z-50">
                <ThemeToggle />
            </div>
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-white/10 dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/20 mb-6 shadow-2xl overflow-hidden w-20 h-20">
                        <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Portal</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome back to ACM Agencies</p>
                </div>

                <div className="bg-white dark:bg-white/10 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-200 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-head-shake">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-500"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="email"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder="admin@acm.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="password"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end mt-1">
                                <Link to="/forgot-password" size="sm" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                            Sign In
                        </button>

                        <div className="pt-4 text-center">
                            <Link to="/signup" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors inline-flex items-center gap-1 group">
                                First time here? <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">Create an account</span>
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-xs italic">
                        © 2026 ACM Agencies. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
