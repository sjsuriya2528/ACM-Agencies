import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { IndianRupee, FileText, LogOut, Clock, TrendingUp } from 'lucide-react';
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
                const [paymentsRes, invoicesRes] = await Promise.all([
                    api.get('/payments'),
                    api.get('/invoices')
                ]);

                // Calculate Present Day Collections
                const today = new Date().toDateString();
                const myPaymentsToday = paymentsRes.data.filter(p => {
                    const paymentDate = new Date(p.createdAt).toDateString();
                    // Check if collected by current user (assuming p.collectedBy.id or p.collectedById matches user.id)
                    const collectedById = p.collectedBy?.id || p.collectedById;
                    return collectedById === user.id && paymentDate === today;
                });
                const todayCollection = myPaymentsToday.reduce((sum, p) => sum + parseFloat(p.amount), 0);

                // Calculate Pending Collection Orders
                const pendingOrders = invoicesRes.data.filter(inv =>
                    inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partially Paid'
                ).length;

                setStats({ todayCollection, pendingOrders });
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
                        {user?.name?.charAt(0) || 'C'}
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Welcome back</p>
                        <h1 className="text-xl font-extrabold text-slate-800">{user?.name || 'Agent'}</h1>
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
            <div className="grid grid-cols-2 gap-4 mb-8">
                <StatCard
                    title="Today's Collection"
                    value={`₹${stats.todayCollection.toLocaleString()}`}
                    icon={TrendingUp}
                    color="bg-emerald-500"
                    subtext="Collected Today"
                />
                <StatCard
                    title="Pending Orders"
                    value={stats.pendingOrders}
                    icon={Clock}
                    color="bg-amber-500"
                    subtext="To be collected"
                />
            </div>

            {/* Actions Grid */}
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-1 flex items-center gap-2">
                <IndianRupee size={20} className="text-blue-500" /> Collections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <QuickActionCard
                    title="Collect Payment"
                    desc="Record new payments"
                    icon={IndianRupee}
                    color="bg-purple-600"
                    onClick={() => navigate('/collect-payment')}
                />
                <QuickActionCard
                    title="Payment History"
                    desc="View past collections"
                    icon={FileText}
                    color="bg-indigo-600"
                    onClick={() => navigate('/payment-history')}
                />
            </div>
        </div>
    );
};

export default CollectionDashboard;
