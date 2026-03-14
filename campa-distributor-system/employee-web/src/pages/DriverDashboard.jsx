import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Truck, MapPin, LogOut, Package, CheckCircle, Clock, TrendingUp, ChevronRight, Navigation, CreditCard, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ThemeToggle from '../components/ThemeToggle';

const DriverDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pending: 0,
        dispatched: 0,
        delivered: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/analytics/employee-stats');
                const data = response.data;

                setStats({
                    pending: data.pending || 0,
                    dispatched: data.dispatched || 0,
                    delivered: data.delivered || 0
                });
            } catch (error) {
                console.error("Failed to fetch driver stats", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchStats();
    }, [user]);

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="relative overflow-hidden bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/10 hover:border-blue-500/30 transition-all duration-300 group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
            <div className="relative z-10">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-10 w-fit mb-4 text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-white/5`}>
                    <Icon size={22} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{title}</p>
                {subtext && <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-4 font-bold bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg w-fit border border-slate-200 dark:border-white/5">{subtext}</p>}
            </div>
        </div>
    );

    const QuickActionCard = ({ title, desc, icon: Icon, color, onClick }) => (
        <button
            onClick={onClick}
            className="group relative overflow-hidden bg-white dark:bg-white/5 dark:backdrop-blur-xl p-7 rounded-[2rem] shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/10 hover:border-blue-500/50 transition-all duration-300 text-left w-full active:scale-95"
        >
            <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            <div className="flex items-center gap-6 relative z-10">
                <div className={`p-5 rounded-2xl ${color} bg-opacity-10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-slate-100 dark:border-white/5`}>
                    <Icon size={32} />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tighter italic">{title}</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">{desc}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-600/10 dark:group-hover:bg-blue-500/10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all border border-slate-200 dark:border-white/5">
                    <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </button>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 pb-40">
            {/* Immersive Cinematic Header */}
            <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl px-6 pt-10 pb-16 rounded-b-[4rem] shadow-[0_20px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-b border-slate-200 dark:border-white/5 relative overflow-hidden transition-all duration-500">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-[-30%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-[150px] opacity-20 dark:opacity-100"></div>
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 dark:bg-indigo-600/5 rounded-full blur-[100px] opacity-20 dark:opacity-100"></div>
                </div>

                <div className="flex justify-between items-center max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-[2.5rem] opacity-40 group-hover:opacity-100 transition-all duration-700 blur-[12px]"></div>
                            <div className="relative w-22 h-22 rounded-[2rem] bg-white dark:bg-slate-900 p-1.5 shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-950"></div>
                                <div className="relative w-full h-full rounded-[1.6rem] bg-white dark:bg-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-black text-3xl shadow-inner italic uppercase">
                                    {user?.name?.charAt(0) || 'D'}
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-slate-950 rounded-full shadow-2xl animate-pulse"></div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mb-1">Driver</p>
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Welcome, {user?.name?.split(' ')[0]}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={() => navigate('/profile')}
                            className="p-5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[2rem] transition-all duration-500 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 shadow-2xl group active:scale-95"
                            title="Profile"
                        >
                            <User size={28} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-5 bg-slate-100 dark:bg-rose-500/5 text-slate-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-100 hover:bg-slate-200 dark:hover:bg-rose-500/40 rounded-[2rem] transition-all duration-500 border border-slate-200 dark:border-white/5 hover:border-rose-500/50 shadow-2xl group active:scale-95"
                            title="Logout"
                        >
                            <LogOut size={28} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-6 -mt-10 max-w-7xl mx-auto space-y-16 relative z-20">
                {/* High-Precision Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatCard
                        title="Pending"
                        value={stats.pending}
                        icon={Package}
                        color="from-amber-400 to-orange-600"
                        subtext="Orders to Pick"
                    />
                    <StatCard
                        title="In Route"
                        value={stats.dispatched}
                        icon={Truck}
                        color="from-blue-500 to-indigo-700"
                        subtext="On Delivery"
                    />
                    <StatCard
                        title="Delivered"
                        value={stats.delivered}
                        icon={CheckCircle}
                        color="from-emerald-500 to-teal-700"
                        subtext="Completed"
                    />
                    <StatCard
                        title="Success Rate"
                        value="98.4%"
                        icon={TrendingUp}
                        color="from-violet-500 to-fuchsia-700"
                        subtext="Delivery Stats"
                    />
                </div>

                {/* Tactical Operations Hub */}
                <div className="space-y-10">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-widest flex items-center gap-6 italic uppercase">
                            <span className="w-16 h-2 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"></span>
                            Quick Actions
                        </h2>
                        <div className="hidden md:flex items-center gap-4 text-[9px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.5em]">
                            <span className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-500 rounded-full animate-ping"></span>
                            System Active
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <QuickActionCard
                            title="My Deliveries"
                            desc="View and manage your delivery routes"
                            icon={Package}
                            color="from-blue-600 to-indigo-800"
                            onClick={() => navigate('/my-deliveries')}
                        />
                        <QuickActionCard
                            title="Create Order"
                            desc="Place a new order for retailers"
                            icon={MapPin}
                            color="from-emerald-600 to-teal-800"
                            onClick={() => navigate('/create-order')}
                        />
                        <QuickActionCard
                            title="Collect Payment"
                            desc="Record payments from retailers"
                            icon={CreditCard}
                            color="from-violet-600 to-purple-800"
                            onClick={() => navigate('/collect-payment')}
                        />
                    </div>
                </div>

                {/* Sub-Sector: Operational Ledger */}
                <div className="bg-white dark:bg-white/5 dark:backdrop-blur-3xl p-10 rounded-[4rem] border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden group transition-all duration-500">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000 group-hover:rotate-12">
                        <Navigation size={180} />
                    </div>
                    
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-4 italic uppercase tracking-tighter">
                            <Clock size={24} className="text-blue-600 dark:text-blue-500" strokeWidth={3} /> Recent Activity
                        </h3>
                        <button
                            onClick={() => navigate('/my-deliveries')}
                            className="bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-[10px] font-black uppercase tracking-[0.4em] px-8 py-4 rounded-[1.5rem] transition-all border border-slate-200 dark:border-white/5 active:scale-95 shadow-inner"
                        >
                            View All
                        </button>
                    </div>
                    <div className="space-y-6 relative z-10">
                        {stats.dispatched > 0 ? (
                            <div className="flex items-center gap-8 p-10 bg-blue-600/5 rounded-[3rem] border border-blue-600/20 group/item hover:bg-blue-600/10 transition-all duration-500 shadow-inner">
                                <div className="p-6 bg-blue-600/10 text-blue-400 rounded-[2rem] shadow-2xl border border-white/5 group-hover/item:scale-110 group-hover/item:rotate-6 transition-transform">
                                    <Navigation size={32} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Orders in Transit</p>
                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mt-1">You have orders on the way.</p>
                                </div>
                                <button onClick={() => navigate('/my-deliveries')} className="p-6 text-white hover:bg-white/5 rounded-full transition-all active:scale-90 border border-transparent hover:border-white/5 group-hover/item:translate-x-2">
                                    <ChevronRight size={36} strokeWidth={3} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-black/40 rounded-[3rem] border border-white/5 border-dashed relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
                                <p className="text-slate-700 text-[11px] font-black uppercase tracking-[0.8em] relative z-10">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverDashboard;
