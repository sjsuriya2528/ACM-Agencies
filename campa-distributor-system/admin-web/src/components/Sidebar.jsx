import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    Store,
    Users,
    ShoppingCart,
    Truck,
    CreditCard,
    LogOut
} from 'lucide-react';

const Sidebar = () => {
    const { logout } = useContext(AuthContext);
    const location = useLocation();

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/products', label: 'Products', icon: <Package size={20} /> },
        { path: '/retailers', label: 'Retailers', icon: <Store size={20} /> },
        { path: '/users', label: 'Users', icon: <Users size={20} /> },
        { path: '/orders', label: 'Orders', icon: <ShoppingCart size={20} /> },
        { path: '/deliveries', label: 'Deliveries', icon: <Truck size={20} /> },
        { path: '/payments', label: 'Payments', icon: <CreditCard size={20} /> },
    ];

    return (
        <div className="w-72 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-700/50">
                <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                    Campa Admin
                </div>
                <p className="text-xs text-slate-400 mt-1">Distributor Management System</p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600/90 shadow-lg shadow-blue-900/50 text-white font-medium'
                                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:pl-5'
                                }`}
                        >
                            <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-700/50">
                <button
                    onClick={() => {
                        logout();
                        window.location.href = '/login';
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-600 hover:text-white text-red-200 border border-red-500/20 font-semibold py-3 px-4 rounded-xl transition-all duration-300"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
