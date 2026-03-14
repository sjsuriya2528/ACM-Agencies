import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { Mail, Lock, User, UserPlus, ShieldCheck, ChevronRight, Phone, MapPin } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const response = await axios.post('/auth/register', {
                name,
                email,
                password,
                role: 'admin' // Hardcoded for Admin Web
            });

            // The register endpoint returns user data and token
            // We can directly login the user
            const userData = response.data;
            localStorage.setItem('adminUser', JSON.stringify(userData));
            // Note: AuthContext might need a way to set user directly, 
            // but for now, we'll redirect to login or just use the login result logic if possible.
            // Actually, let's just redirect to login for simplicity after signup or use the context.
            
            // For now, let's assume we redirect to login to ensure clean state
            navigate('/login', { state: { message: 'Account created successfully! Please login.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-mesh flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
            <div className="absolute top-8 right-8 z-50">
                <ThemeToggle />
            </div>
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 dark:bg-blue-600/20 rounded-full blur-[120px] opacity-20 dark:opacity-100"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/5 dark:bg-cyan-600/20 rounded-full blur-[120px] opacity-20 dark:opacity-100"></div>
            </div>

            <div className="w-full max-w-md animate-scale-in z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-white/10 dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/20 mb-6 shadow-2xl overflow-hidden w-20 h-20">
                        <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create Account</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Join ACM Agencies Administrator Team</p>
                </div>

                <div className="bg-white dark:bg-white/10 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-8 rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.05)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-200 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-head-shake">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-500"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

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
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-900/20 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-2 group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <UserPlus size={20} className="group-hover:translate-x-1 transition-transform" />
                                    Create Account
                                </>
                            )}
                        </button>

                        <div className="pt-4 text-center">
                            <Link to="/login" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors inline-flex items-center gap-1 group">
                                Already have an account? <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">Sign In</span>
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 dark:text-slate-500 text-xs italic">
                        © 2026 ACM Agencies. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
