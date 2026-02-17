import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { IndianRupee, FileText, LogOut, Clock, TrendingUp, Wallet, ShieldCheck, ChevronRight, User, History } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

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
        <div className="relative overflow-hidden bg-white p-7 rounded-[2.5rem] shadow-xl border border-slate-50 group hover:-translate-y-1 transition-all duration-500">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110`}></div>
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-3xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                    <Icon size={24} />
                </div>
                <div className="p-2 bg-emerald-50 rounded-full text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrendingUp size={16} />
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-black text-slate-800 leading-tight mb-1">{value}</h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{title}</p>
                {subtext && <p className="text-[10px] mt-4 font-black flex items-center gap-1.5 text-slate-400 uppercase tracking-tighter">
                    <ShieldCheck size={12} className="text-emerald-500" /> {subtext}
                </p>}
            </div>
        </div>
    );

    const QuickActionCard = ({ title, desc, icon: Icon, color, onClick }) => (
        <button
            onClick={onClick}
            className="group relative overflow-hidden bg-white p-7 rounded-[2.5rem] shadow-lg border border-slate-50 hover:shadow-2xl hover:border-emerald-100 transition-all duration-500 text-left w-full active:scale-95"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>
            <div className="flex items-center justify-between mb-8">
                <div className={`p-5 rounded-[1.5rem] ${color} bg-opacity-10 text-${color.split('-')[1]}-600 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm`}>
                    <Icon size={32} />
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                    <ChevronRight size={24} />
                </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors tracking-tight">{title}</h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-[80%]">{desc}</p>
        </button>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Standard Immersive Header */}
            <header className="bg-white px-8 pt-12 pb-20 rounded-b-[4rem] shadow-sm border-b border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="flex justify-between items-center max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-full opacity-75 group-hover:opacity-100 transition-opacity blur duration-500"></div>
                            <div className="relative w-20 h-20 rounded-full bg-white p-1">
                                <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center text-emerald-600 font-black text-3xl shadow-inner uppercase">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-emerald-100">Collection Agent</span>
                                <span className="text-slate-300 font-bold">/</span>
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter leading-tight">
                                Hello, <span className="text-emerald-600">{user?.name?.split(' ')[0]}</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/sales-dashboard')}
                            className="p-4 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-[1.5rem] transition-all duration-300 border border-transparent hover:border-emerald-100 flex flex-col items-center gap-1 group shadow-sm active:scale-90"
                        >
                            <Wallet size={24} className="group-hover:translate-x-0.5 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Sales</span>
                        </button>
                        <button
                            onClick={logout}
                            className="p-4 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-[1.5rem] transition-all duration-300 border border-transparent hover:border-rose-200 flex flex-col items-center gap-1 group shadow-sm active:scale-90"
                        >
                            <LogOut size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-6 -mt-10 max-w-7xl mx-auto space-y-12 relative z-20">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <StatCard
                        title="Today Collected"
                        value={`₹${stats.todayCollection.toLocaleString()}`}
                        icon={IndianRupee}
                        color="from-emerald-500 to-teal-600"
                        subtext="Settled with Admin"
                    />
                    <StatCard
                        title="Open Invoices"
                        value={stats.pendingOrders}
                        icon={Clock}
                        color="from-amber-400 to-orange-500"
                        subtext="Requiring Follow-up"
                    />
                </div>

                {/* Quick Actions */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                            Priority Tasks
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <QuickActionCard
                            title="Collect Payments"
                            desc="Access the pending invoices list to record new cash/UPI/Cheque collections."
                            icon={Wallet}
                            color="from-emerald-500 to-teal-600"
                            onClick={() => navigate('/collect-payment')}
                        />
                        <QuickActionCard
                            title="Receipt Records"
                            desc="Browse and search through your historical payment collection logs."
                            icon={History}
                            color="from-blue-500 to-indigo-600"
                            onClick={() => navigate('/payment-history')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollectionDashboard;
