import React, { useContext, useEffect, useState } from 'react';
import { ShoppingCart, Users, LogOut, FileText, CheckCircle, Clock, IndianRupee, TrendingUp, Package, MapPin, User } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const SalesDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalOrders: 0,
        requested: 0,
        accepted: 0,
        totalAmount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/orders');
                const orders = Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []);

                if (!Array.isArray(orders)) {
                    console.warn("Filter warning: 'orders' is not an array in SalesDashboard. Type:", typeof orders, "Value:", orders);
                }
                const ordersList = Array.isArray(orders) ? orders : [];
                const totalOrders = ordersList.length;
                const requested = ordersList.filter(o => o.status === 'Requested').length;
                const accepted = ordersList.filter(o => o.status === 'Approved').length;
                const totalAmount = ordersList.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

                setStats({ totalOrders, requested, accepted, totalAmount });
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

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="relative overflow-hidden bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/10 hover:border-blue-500/30 transition-all duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110`}></div>

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-blue-600 dark:text-blue-400`}>
                        <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">{subtext}</span>
                </div>

                <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{value}</h3>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{title}</p>
                </div>
            </div>
        </div>
    );

    const QuickActionCard = ({ title, desc, icon: Icon, color, onClick }) => (
        <button
            onClick={onClick}
            className="group relative overflow-hidden bg-white dark:bg-white/5 dark:backdrop-blur-xl p-6 rounded-3xl shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/10 hover:border-blue-500/50 transition-all duration-300 text-left w-full h-full active:scale-95"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`}></div>

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-blue-600 dark:text-blue-400 transition-transform duration-500 shadow-sm border border-slate-100 dark:border-white/5`}>
                    <Icon size={28} />
                </div>
                <div className="bg-slate-100 dark:bg-white/10 p-2 rounded-xl text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-600/10 dark:group-hover:bg-blue-500/10 transition-all">
                    <TrendingUp size={20} />
                </div>
            </div>

            <div className="relative z-10">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-blue-400 transition-colors tracking-tight">{title}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">{desc}</p>
            </div>
        </button>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 pb-40">
            {/* Immersive Cinematic Header */}
            <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl px-6 pt-12 pb-16 rounded-b-[4rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-b border-slate-200 dark:border-white/5 relative overflow-hidden transition-all duration-200">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-[150px] opacity-20 dark:opacity-100"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 dark:bg-indigo-600/5 rounded-full blur-[120px] opacity-20 dark:opacity-100"></div>
                </div>
                
                <div className="flex justify-between items-center max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute -inset-1.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] opacity-40 group-hover:opacity-100 transition-all duration-700 blur-[10px]"></div>
                            <div className="relative w-20 h-20 rounded-[2.2rem] bg-white dark:bg-slate-900 flex items-center justify-center p-1 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-950"></div>
                                <div className="relative w-full h-full rounded-[1.8rem] bg-white dark:bg-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-black text-3xl shadow-inner italic">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-4 border-white dark:border-slate-950 rounded-full shadow-2xl animate-pulse"></div>
                        </div>
                        <div>
                            <p className="text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] mb-1">Welcome Back</p>
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{user?.name || 'User'}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <button
                            onClick={() => navigate('/profile')}
                            className="p-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[1.5rem] transition-all duration-500 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] active:scale-95 group"
                            title="My Profile"
                        >
                            <User size={26} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[1.5rem] transition-all duration-500 border border-slate-200 dark:border-white/5 hover:border-rose-500/30 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)] active:scale-95 group"
                            title="Logout"
                        >
                            <LogOut size={26} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-6 -mt-10 max-w-7xl mx-auto space-y-16 relative z-20">
                {/* High-Impact Analytics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Orders"
                        value={stats.totalOrders}
                        icon={FileText}
                        color="from-blue-600 to-indigo-600"
                        subtext="Orders"
                    />
                    <StatCard
                        title="Pending"
                        value={stats.requested}
                        icon={Clock}
                        color="from-amber-400 to-orange-600"
                        subtext="Requested"
                    />
                    <StatCard
                        title="Approved"
                        value={stats.accepted}
                        icon={CheckCircle}
                        color="from-emerald-400 to-teal-600"
                        subtext="Confirmed"
                    />
                    <StatCard
                        title="Total Sales"
                        value={`₹${stats.totalAmount.toLocaleString()}`}
                        icon={IndianRupee}
                        color="from-violet-600 to-fuchsia-600"
                        subtext="Sales"
                    />
                </div>

                {/* Tactical Operations Interface */}
                <div className="space-y-10">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-widest flex items-center gap-6 uppercase italic">
                            <span className="w-12 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></span>
                            Dashboard
                        </h2>
                        <div className="hidden md:flex items-center gap-4 text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.4em]">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            System Active
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <QuickActionCard
                            title="Create Order"
                            desc="Place a new order for retailers"
                            icon={ShoppingCart}
                            color="from-blue-600 to-cyan-500"
                            onClick={() => navigate('/create-order')}
                        />
                        <QuickActionCard
                            title="View Orders"
                            desc="Track and manage your orders"
                            icon={Package}
                            color="from-violet-600 to-fuchsia-500"
                            onClick={() => navigate('/view-orders')}
                        />
                        <QuickActionCard
                            title="Retailers"
                            desc="View and manage retailer list"
                            icon={Users}
                            color="from-emerald-600 to-teal-500"
                            onClick={() => navigate('/retailers')}
                        />
                        <QuickActionCard
                            title="Collect Payment"
                            desc="Record payments from retailers"
                            icon={IndianRupee}
                            color="from-amber-500 to-orange-500"
                            onClick={() => navigate('/collect-payment')}
                        />
                        <QuickActionCard
                            title="Analytics"
                            desc="View sales and collection reports"
                            icon={TrendingUp}
                            color="from-rose-600 to-pink-500"
                            onClick={() => navigate('/collection-dashboard')}
                        />
                        <QuickActionCard
                            title="My Profile"
                            desc="Manage your account and password"
                            icon={User}
                            color="from-slate-700 to-slate-900"
                            onClick={() => navigate('/profile')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;
