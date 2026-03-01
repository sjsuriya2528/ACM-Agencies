import React, { useContext, useEffect, useState } from 'react';
import { ShoppingCart, Users, LogOut, FileText, CheckCircle, Clock, IndianRupee, TrendingUp, Package, MapPin } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

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

                const totalOrders = orders.length;
                const requested = (orders || []).filter(o => o.status === 'Requested').length;
                const accepted = (orders || []).filter(o => o.status === 'Approved').length;
                const totalAmount = (orders || []).reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

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
        <div className="relative overflow-hidden bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110`}></div>

            <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
                        <Icon size={24} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-full">{subtext}</span>
                </div>

                <div>
                    <h3 className="text-3xl font-black text-slate-800 mb-1">{value}</h3>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                </div>
            </div>
        </div>
    );

    const QuickActionCard = ({ title, desc, icon: Icon, color, onClick }) => (
        <button
            onClick={onClick}
            className="group relative overflow-hidden bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:shadow-2xl hover:border-blue-100 transition-all duration-300 text-left w-full h-full"
        >
            <div className={`absolute inset-0 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <Icon size={28} />
                </div>
                <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                    <TrendingUp size={20} />
                </div>
            </div>

            <div className="relative z-10">
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">{title}</h2>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
        </button>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Immersive Header */}
            <header className="bg-white px-6 pt-8 pb-12 rounded-b-[3rem] shadow-sm border-b border-slate-100">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-blue-200 ring-4 ring-white">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Welcome back,</p>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{user?.name || 'Sales Rep'}</h1>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300 group"
                        title="Logout"
                    >
                        <LogOut size={24} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </header>

            <div className="px-4 md:px-6 -mt-8 max-w-7xl mx-auto space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard
                        title="Total Orders"
                        value={stats.totalOrders}
                        icon={FileText}
                        color="from-blue-500 to-blue-600"
                        subtext="Lifetime"
                    />
                    <StatCard
                        title="Pending"
                        value={stats.requested}
                        icon={Clock}
                        color="from-amber-400 to-amber-500"
                        subtext="Awaiting"
                    />
                    <StatCard
                        title="Completed"
                        value={stats.accepted}
                        icon={CheckCircle}
                        color="from-emerald-400 to-emerald-500"
                        subtext="Delivered"
                    />
                    <StatCard
                        title="Revenue"
                        value={`₹${stats.totalAmount.toLocaleString()}`}
                        icon={IndianRupee}
                        color="from-violet-500 to-violet-600"
                        subtext="Total"
                    />
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 px-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <TrendingUp size={20} />
                        </div>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <QuickActionCard
                            title="New Order"
                            desc="Create a new order for a retailer"
                            icon={ShoppingCart}
                            color="from-blue-500 to-indigo-600"
                            onClick={() => navigate('/create-order')}
                        />
                        <QuickActionCard
                            title="Track Orders"
                            desc="View status of all your orders"
                            icon={Package}
                            color="from-violet-500 to-purple-600"
                            onClick={() => navigate('/view-orders')}
                        />
                        <QuickActionCard
                            title="Retailers"
                            desc="Manage and add new retailers"
                            icon={Users}
                            color="from-emerald-500 to-teal-600"
                            onClick={() => navigate('/retailers')}
                        />
                        <QuickActionCard
                            title="Payments"
                            desc="Collect and view payments"
                            icon={IndianRupee}
                            color="from-amber-500 to-orange-600"
                            onClick={() => navigate('/collect-payment')}
                        />
                        <QuickActionCard
                            title="Collection"
                            desc="View collection dashboard"
                            icon={FileText}
                            color="from-pink-500 to-rose-600"
                            onClick={() => navigate('/collection-dashboard')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;
