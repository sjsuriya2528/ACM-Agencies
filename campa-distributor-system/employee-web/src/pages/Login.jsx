import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, LogIn, ShieldCheck, ChevronRight, Loader } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';
    const successMessage = location.state?.message;

    useEffect(() => {
        if (successMessage) {
            // Optional: Show a toast or message
        }
    }, [successMessage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                navigate(from, { replace: true });
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-200">
            <div className="absolute top-8 right-8 z-50">
                <ThemeToggle />
            </div>
            {/* Ultra-Modern Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[150px] opacity-20 dark:opacity-100"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[150px] opacity-20 dark:opacity-100"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.01)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]"></div>
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 dark:bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-slate-200 dark:border-white/10 mb-6 shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <LogIn size={40} className="text-blue-600 dark:text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Employee Portal</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">Secure Access Terminal</p>
                </div>

                <div className="bg-white dark:bg-white/5 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-all duration-500"></div>
                    
                    {successMessage && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-5 rounded-2xl mb-8 text-xs font-black uppercase tracking-widest flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                            <ShieldCheck size={20} className="text-emerald-500" />
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-5 rounded-2xl mb-8 text-xs font-black uppercase tracking-widest flex items-center gap-4 animate-head-shake">
                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.3em] ml-2">Work Identity (Email)</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="email"
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800 font-black tracking-tight"
                                    placeholder="operator@acm.systems"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-[0.3em]">Credentials</label>
                                <Link to="/forgot-password" size="sm" className="text-[10px] text-blue-500 hover:text-blue-400 transition-colors font-black uppercase tracking-widest italic decoration-blue-500/30 underline-offset-4 hover:underline">
                                    Forgot Key?
                                </Link>
                            </div>
                            <div className="relative group/input">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-blue-400 transition-colors" size={20} />
                                <input
                                    type="password"
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-800 font-black tracking-tight"
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
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 font-black py-5 rounded-[1.5rem] shadow-2xl dark:shadow-white/5 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs border border-slate-800 dark:border-white"
                        >
                            {loading ? <Loader className="animate-spin" size={22} strokeWidth={3} /> : (
                                <>
                                    Authorize Session <ChevronRight size={22} strokeWidth={3} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10 text-center">
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest">
                            New Personnel?{' '}
                            <Link to="/signup" className="text-blue-600 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors italic ml-1">
                                Initialize Registration
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
