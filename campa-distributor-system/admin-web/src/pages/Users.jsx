import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Plus,
    Edit,
    Trash2,
    Users as UsersIcon,
    TrendingUp,
    Award,
    Calendar,
    IndianRupee,
    Package,
    UserPlus,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Users = () => {
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'performance'
    const [users, setUsers] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'sales_rep', phone: '' });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [limit] = useState(50);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else {
            fetchPerformanceData();
        }
    }, [activeTab, page, activeSearch]);

    // Handle search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setActiveSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users', {
                params: {
                    page,
                    limit,
                    search: activeSearch
                }
            });
            const responseData = response.data.data || (Array.isArray(response.data) ? response.data : []);
            setUsers(responseData);
            setTotalPages(response.data.totalPages || 1);
            setTotalResults(response.data.total !== undefined ? response.data.total : responseData.length);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPerformanceData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/analytics/performance');
            setPerformanceData(response.data);
        } catch (error) {
            console.error("Failed to fetch performance data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/users/${editingId}`, formData);
            } else {
                await api.post('/users', formData);
            }
            setIsModalOpen(false);
            setFormData({ name: '', email: '', password: '', role: 'sales_rep', phone: '' });
            setEditingId(null);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Operation failed: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (user) => {
        setFormData({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
        setEditingId(user.id);
        setIsModalOpen(true);
    };

    const getRoleBadge = (role) => {
        const styles = {
            'admin': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50',
            'sales_rep': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
            'driver': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
            'collection_agent': 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[role] || 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-700'}`}>
                {role.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in-up space-y-8 p-2">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Team Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage users and track sales performance</p>
                </div>

                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 transition-colors">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                            }`}
                    >
                        <UsersIcon size={16} /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'performance' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                            }`}
                    >
                        <TrendingUp size={16} /> Performance
                    </button>
                </div>
            </header>

            {activeTab === 'users' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search name, email, phone... "
                                className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-medium shadow-sm outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ name: '', email: '', password: '', role: 'sales_rep', phone: '' }); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95 shrink-0 transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} /> Add User
                        </button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-500">
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 transition-colors">
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors bg-white dark:bg-slate-900">
                                {(users || []).length === 0 ? (
                                    <tr><td colSpan="4" className="p-12 text-center text-slate-400 dark:text-slate-500 font-medium">No users found match your search.</td></tr>
                                ) : (users || []).map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{user.name}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-3">
                                            <button onClick={() => startEdit(user)} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(user.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {totalResults > 0 && (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    Showing <span className="text-slate-900 dark:text-slate-100 font-bold">{Math.min(totalResults, (page - 1) * limit + 1)}</span> to{' '}
                                    <span className="text-slate-900 dark:text-slate-100 font-bold">{Math.min(totalResults, page * limit)}</span> of{' '}
                                    <span className="text-black dark:text-white font-black">{totalResults}</span> users
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                        disabled={page === 1}
                                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white dark:bg-slate-900 shadow-sm text-slate-600 dark:text-slate-400"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
 
                                    <div className="flex items-center gap-1 text-slate-600">
                                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) pageNum = i + 1;
                                            else if (page <= 3) pageNum = i + 1;
                                            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                            else pageNum = page - 2 + i;
 
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setPage(pageNum)}
                                                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${page === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-blue-900/20' : 'hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                    </div>
 
                                    <button
                                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={page === totalPages}
                                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white dark:bg-slate-900 shadow-sm text-slate-600 dark:text-slate-400"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'performance' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Performer Card */}
                        {Array.isArray(performanceData) && performanceData.length > 0 && (
                            <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                    <p className="text-white/70 font-black uppercase tracking-[0.2em] text-[10px] mb-3">Top Performer Today</p>
                                    <h2 className="text-3xl font-black mb-1 tracking-tight">{performanceData[0].name}</h2>
                                    <p className="text-indigo-100 text-sm font-medium opacity-90">
                                        ₹{Number(performanceData[0].salesToday).toLocaleString()} sales <span className="mx-2 opacity-50">|</span> {performanceData[0].ordersToday} orders
                                    </p>
                                </div>
                                <Award className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition-transform duration-700" size={140} />
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-500">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Sales Representatives Activity</h3>
                        </div>
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 transition-colors">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Representative</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Orders Today</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Sales Today</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Total Orders</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Total Sales</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 transition-colors bg-white dark:bg-slate-900">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading performance data...</td></tr>
                                ) : (performanceData || []).map((rep, idx) => (
                                    <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-300'}`}>
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{rep.name}</p>
                                                    <p className="text-xs text-slate-400">{rep.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 font-semibold ${rep.ordersToday > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {rep.ordersToday > 0 && <TrendingUp size={14} />}
                                                {rep.ordersToday}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white">
                                            ₹{Number(rep.salesToday).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                                            {rep.totalOrders}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-400">
                                            ₹{Number(rep.totalSales).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10 transition-colors duration-500">
                        <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">{editingId ? 'Edit User' : 'New User'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white focus:outline-none transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
                                <input type="email" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white focus:outline-none transition-all" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            {!editingId && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label>
                                    <input type="password" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white focus:outline-none transition-all" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Role</label>
                                <select
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white focus:outline-none transition-all"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="sales_rep">Sales Representative</option>
                                    <option value="driver">Driver</option>
                                    <option value="collection_agent">Collection Agent</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Phone</label>
                                <input type="text" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white focus:outline-none transition-all" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md shadow-blue-200 dark:shadow-blue-900/40 transition-all hover:scale-105">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
