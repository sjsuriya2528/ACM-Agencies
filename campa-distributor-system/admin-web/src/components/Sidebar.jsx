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
    LogOut,
    FileText,
    BarChart2,
    ClipboardList,
    BookOpen,
    User
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

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
        { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
        { path: '/ledger-report', label: 'Ledger Report', icon: <BookOpen size={20} /> },
        { path: '/purchases', label: 'Purchases & Stock', icon: <ClipboardList size={20} /> },
        { path: '/rep-performance', label: 'Rep Performance', icon: <BarChart2 size={20} /> },
        { path: '/profile', label: 'My Profile', icon: <User size={20} /> },
    ];

    return (
        <div className="w-72 h-screen bg-[#0f172a] border-r border-white/5 text-slate-300 flex flex-col shadow-2xl transition-all duration-500">
            <div className="p-6 border-b border-white/5 flex justify-between items-start">
                <div>
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                        ACM Agencies
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">Distributor Management System</p>
                </div>
                <ThemeToggle />
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-300 group ${isActive
                                ? 'bg-blue-600 shadow-xl shadow-blue-600/20 text-white font-bold'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white hover:pl-5'
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

            <div className="p-4 border-t border-white/5">
                <button
                    onClick={() => {
                        logout();
                        window.location.href = '/login';
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-black py-3.5 px-4 rounded-2xl transition-all duration-300 active:scale-95 group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="uppercase tracking-widest text-[11px]">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
