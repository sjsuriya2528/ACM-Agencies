import React, { useContext, useEffect, useState } from 'react';
import { ShoppingCart, Users, LogOut, FileText, CheckCircle, Clock, IndianRupee, TrendingUp, Package, MapPin } from 'lucide-react';
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
                const orders = response.data;

                const totalOrders = orders.length;
                const requested = orders.filter(o => o.status === 'Requested').length;
                const accepted = orders.filter(o => o.status === 'Approved').length;
                const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

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
        <div className={`relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}>
            {/* Background Decoration */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${color}`}></div>
            <div className={`absolute -left-6 -bottom-6 w-16 h-16 rounded-full opacity-5 ${color}`}></div>

            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-2xl font-extrabold text-slate-800">{value}</h3>
                    {subtext && <p className={`text-[10px] mt-2 font-medium flex items-center gap-1 ${color.replace('bg-', 'text-')}`}>
                        {subtext}
                    </p>}
                </div>
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 backdrop-blur-sm`}>
                    <Icon size={20} className={color.replace('bg-', 'text-').replace('/10', '')} />
                </div>
            </div>
        </div>
    );

    const QuickActionCard = ({ title, desc, icon: Icon, color, onClick }) => (
        <button
            onClick={onClick}
            className="flex items-center p-5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-100 group text-left w-full h-full relative overflow-hidden"
        >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${color}`}></div>
            <div className={`p-4 rounded-full mr-4 transition-colors ${color} bg-opacity-10 group-hover:bg-opacity-20`}>
                <Icon size={24} className={color.replace('bg-', 'text-').replace('/10', '')} />
            </div>
            <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{title}</h2>
                <p className="text-slate-500 text-sm font-medium">{desc}</p>
            </div>
            <div className="text-slate-300 group-hover:translate-x-1 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 pb-24">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Welcome back</p>
                        <h1 className="text-xl font-extrabold text-slate-800">{user?.name || 'Sales Rep'}</h1>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Logout"
                >
                    <LogOut size={22} />
                </button>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={FileText}
                    color="bg-blue-600"
                    subtext="Lifetime Orders"
                />
                <StatCard
                    title="Requested"
                    value={stats.requested}
                    icon={Clock}
                    color="bg-amber-500"
                    subtext="Pending Approval"
                />
                <StatCard
                    title="Approved"
                    value={stats.accepted}
                    icon={CheckCircle}
                    color="bg-emerald-500"
                    subtext="Ready / Delivered"
                />
                <StatCard
                    title="Total Sales"
                    value={`₹${stats.totalAmount.toLocaleString()}`}
                    icon={IndianRupee}
                    color="bg-violet-600"
                    subtext="Total Revenue"
                />
            </div>

            {/* Actions Grid */}
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-1 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" /> Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <QuickActionCard
                    title="New Order"
                    desc="Create a new order for a retailer"
                    icon={ShoppingCart}
                    color="bg-blue-600"
                    onClick={() => navigate('/create-order')}
                />
                <QuickActionCard
                    title="Track Orders"
                    desc="View status of all your orders"
                    icon={Package}
                    color="bg-indigo-600"
                    onClick={() => navigate('/view-orders')}
                />
                <QuickActionCard
                    title="Manage Retailers"
                    desc="View and add new retailers"
                    icon={Users}
                    color="bg-emerald-600"
                    onClick={() => navigate('/retailers')}
                />
            </div>

            {/* Recent Activity Placeholder (Optional) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800">Recent Activity</h3>
                    <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">View All</button>
                </div>
                <div className="text-center py-8 text-slate-400 text-sm">
                    No recent activity to show.
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;
