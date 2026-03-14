import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { IndianRupee, FileText, LogOut, Clock, TrendingUp, Wallet, ShieldCheck, ChevronRight, User, History } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ThemeToggle from '../components/ThemeToggle';

const CollectionDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        todayCollection: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/analytics/employee-stats');
                const data = response.data;

                setStats({
                    todayCollection: data.todayCollection || 0,
                    pendingOrders: data.pendingInvoices || 0
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="relative overflow-hidden bg-white dark:bg-white/5 dark:backdrop-blur-xl p-8 rounded-[2.5rem] shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/10 group hover:-translate-y-1 transition-all duration-500">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110`}></div>
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-3xl ${color} bg-opacity-10 text-emerald-600 dark:text-emerald-400 border border-slate-100 dark:border-white/5`}>
                    <Icon size={24} />
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrendingUp size={16} />
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-1">{value}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">{title}</p>
                {subtext && <p className="text-[9px] mt-6 font-black flex items-center gap-2 text-slate-500 dark:text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full w-fit border border-slate-200 dark:border-white/5">
                    <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-500" /> {subtext}
                </p>}
            </div>
        </div>
    );

    const QuickActionCard = ({ title, desc, icon: Icon, color, onClick }) => (
        <button
            onClick={onClick}
            className="group relative overflow-hidden bg-white dark:bg-white/5 dark:backdrop-blur-xl p-8 rounded-[2.5rem] shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all duration-500 text-left w-full active:scale-95"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>
            <div className="flex items-center justify-between mb-10">
                <div className={`p-5 rounded-3xl ${color} bg-opacity-10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm border border-slate-100 dark:border-white/5`}>
                    <Icon size={32} />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-emerald-600/10 dark:group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all border border-slate-200 dark:border-white/5">
                    <ChevronRight size={24} />
                </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors tracking-tighter">{title}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed max-w-[90%]">{desc}</p>
        </button>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 pb-40 text-slate-600 dark:text-slate-200">
            {/* Immersive Cinematic Header */}
            <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl px-8 pt-12 pb-20 rounded-b-[4rem] shadow-[0_20px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-b border-slate-200 dark:border-white/5 relative overflow-hidden transition-all duration-500">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full -mr-64 -mt-64 blur-[150px] pointer-events-none opacity-20 dark:opacity-100"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-teal-500/5 dark:bg-teal-500/5 rounded-full blur-[100px] pointer-events-none opacity-20 dark:opacity-100"></div>
                
                <div className="flex justify-between items-center max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-[2.5rem] opacity-40 group-hover:opacity-100 transition-all duration-700 blur-[12px]"></div>
                            <div className="relative w-24 h-24 rounded-[2.2rem] bg-white dark:bg-slate-900 flex items-center justify-center p-1.5 shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-950"></div>
                                <div className="relative w-full h-full rounded-[1.8rem] bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-4xl shadow-inner italic uppercase">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-slate-950 rounded-full shadow-2xl animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] px-4 py-2 rounded-xl border border-emerald-500/20 shadow-inner">Collection</span>
                                <span className="text-slate-800 font-black select-none">/</span>
                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight italic uppercase">
                                Welcome, <span className="text-emerald-500">{user?.name?.split(' ')[0]}</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={() => navigate('/sales-dashboard')}
                            className="p-5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[2rem] transition-all duration-500 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 group shadow-2xl active:scale-95"
                            title="Dashboard"
                        >
                            <Wallet size={28} strokeWidth={2.5} className="group-hover:rotate-6 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className="p-5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[2rem] transition-all duration-500 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 group shadow-2xl active:scale-95"
                            title="Profile"
                        >
                            <User size={28} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={logout}
                            className="p-5 bg-slate-100 dark:bg-rose-500/5 text-slate-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-100 hover:bg-slate-200 dark:hover:bg-rose-500/40 rounded-[2rem] transition-all duration-500 border border-slate-200 dark:border-white/5 hover:border-rose-500/50 group shadow-2xl active:scale-95"
                            title="Logout"
                        >
                            <LogOut size={28} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-6 -mt-12 max-w-7xl mx-auto space-y-20 relative z-20">
                {/* Tactical Analytics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <StatCard
                        title="Today's Collection"
                        value={`₹${stats.todayCollection.toLocaleString()}`}
                        icon={IndianRupee}
                        color="from-emerald-600 to-teal-800"
                        subtext="Total Collected"
                    />
                    <StatCard
                        title="Pending Invoices"
                        value={stats.pendingOrders}
                        icon={Clock}
                        color="from-amber-400 to-orange-600"
                        subtext="Awaiting Payment"
                    />
                </div>

                {/* Priority Operations Sector */}
                <div className="space-y-12">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-widest flex items-center gap-6 italic uppercase">
                            <span className="w-16 h-2 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"></span>
                            Quick Actions
                        </h2>
                        <div className="hidden md:flex items-center gap-4 text-[9px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.5em]">
                            <span className="w-2.5 h-2.5 bg-emerald-600 dark:bg-emerald-500 rounded-full animate-ping"></span>
                            Live Sync Active
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <QuickActionCard
                            title="Collect Payment"
                            desc="Access the pending invoices list to record new cash/UPI/Cheque collections."
                            icon={Wallet}
                            color="from-emerald-600 to-cyan-500"
                            onClick={() => navigate('/collect-payment')}
                        />
                        <QuickActionCard
                            title="Payment History"
                            desc="Browse and search through your historical payment collection logs."
                            icon={History}
                            color="from-blue-600 to-indigo-500"
                            onClick={() => navigate('/payment-history')}
                        />
                        <QuickActionCard
                            title="My Profile"
                            desc="View your details and manage password security via OTP."
                            icon={ShieldCheck}
                            color="from-slate-700 to-slate-900"
                            onClick={() => navigate('/profile')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollectionDashboard;
