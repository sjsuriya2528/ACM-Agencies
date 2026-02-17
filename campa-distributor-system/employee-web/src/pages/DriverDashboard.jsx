import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Truck, MapPin, LogOut, Package, CheckCircle, Clock, TrendingUp, ChevronRight, Navigation, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

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
        <div className="relative overflow-hidden bg-white p-5 rounded-3xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
            <div className="relative z-10">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-10 w-fit mb-4 text-${color.split('-')[1]}-600`}>
                    <Icon size={22} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{title}</p>
                {subtext && <p className="text-[10px] text-slate-400 mt-2 font-medium">{subtext}</p>}
            </div>
        </div>
    );

    const QuickActionCard = ({ title, desc, icon: Icon, color, onClick }) => (
        <button
            onClick={onClick}
            className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:shadow-2xl hover:border-blue-100 transition-all duration-300 text-left w-full"
        >
            <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            <div className="flex items-center gap-5 relative z-10">
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <Icon size={28} />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors tracking-tight">{title}</h2>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                    <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
        </button>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Immersive Header */}
            <header className="bg-white px-6 pt-8 pb-14 rounded-b-[3rem] shadow-sm border-b border-slate-100">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-200 ring-4 ring-white">
                                {user?.name?.charAt(0) || 'D'}
                            </div>
                            <div className="absolute bottom-1 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-0.5">Fleet Logistics</p>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Hi, {user?.name?.split(' ')[0]}!</h1>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300 border border-transparent hover:border-rose-100"
                    >
                        <LogOut size={24} />
                    </button>
                </div>
            </header>

            <div className="px-5 -mt-8 max-w-7xl mx-auto space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Pickups"
                        value={stats.pending}
                        icon={Package}
                        color="from-amber-400 to-orange-500"
                        subtext="Ready for delivery"
                    />
                    <StatCard
                        title="Active"
                        value={stats.dispatched}
                        icon={Truck}
                        color="from-blue-400 to-indigo-600"
                        subtext="Currently on route"
                    />
                    <StatCard
                        title="Completed"
                        value={stats.delivered}
                        icon={CheckCircle}
                        color="from-emerald-400 to-teal-600"
                        subtext="Successfully delivered"
                    />
                    <StatCard
                        title="Efficiency"
                        value="98%"
                        icon={TrendingUp}
                        color="from-violet-400 to-fuchsia-600"
                        subtext="On-time delivery"
                    />
                </div>

                {/* Main Actions */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 px-1">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Truck size={18} />
                        </div>
                        Operations
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <QuickActionCard
                            title="My Deliveries"
                            desc="View current tasks and manage route"
                            icon={Package}
                            color="from-blue-500 to-indigo-600"
                            onClick={() => navigate('/my-deliveries')}
                        />
                        <QuickActionCard
                            title="Create Order"
                            desc="Log a new order while on route"
                            icon={MapPin}
                            color="from-emerald-500 to-teal-600"
                            onClick={() => navigate('/create-order')}
                        />
                        <QuickActionCard
                            title="Payments"
                            desc="Record bill payments from retailers"
                            icon={CreditCard}
                            color="from-violet-500 to-purple-600"
                            onClick={() => navigate('/collect-payment')}
                        />
                        <QuickActionCard
                            title="Collection"
                            desc="View collection dashboard"
                            icon={TrendingUp}
                            color="from-amber-500 to-orange-600"
                            onClick={() => navigate('/collection-dashboard')}
                        />
                    </div>
                </div>

                {/* Recent Activity Placeholder */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Clock size={18} className="text-slate-400" /> Recent Trips
                        </h3>
                        <button
                            onClick={() => navigate('/my-deliveries')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700"
                        >
                            View History
                        </button>
                    </div>
                    <div className="space-y-4">
                        {stats.dispatched > 0 ? (
                            <div className="flex items-center gap-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                    <Navigation size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">You have active deliveries</p>
                                    <p className="text-xs text-slate-500">Resume your current route</p>
                                </div>
                                <button onClick={() => navigate('/my-deliveries')} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-slate-400 text-sm font-medium">No active trips at the moment</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverDashboard;
