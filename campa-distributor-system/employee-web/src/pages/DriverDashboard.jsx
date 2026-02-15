import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Truck, MapPin, LogOut, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DriverDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

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
                        {user?.name?.charAt(0) || 'D'}
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Welcome back</p>
                        <h1 className="text-xl font-extrabold text-slate-800">{user?.name || 'Driver'}</h1>
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

            {/* Actions Grid */}
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-1 flex items-center gap-2">
                <Truck size={20} className="text-blue-500" /> Dashboard
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <QuickActionCard
                    title="My Deliveries"
                    desc="View & manage assignments"
                    icon={Package}
                    color="bg-blue-600"
                    onClick={() => navigate('/my-deliveries')}
                />
                <QuickActionCard
                    title="Create New Order"
                    desc="New order on route"
                    icon={MapPin}
                    color="bg-emerald-600"
                    onClick={() => navigate('/create-order')}
                />
            </div>
        </div>
    );
};

export default DriverDashboard;
