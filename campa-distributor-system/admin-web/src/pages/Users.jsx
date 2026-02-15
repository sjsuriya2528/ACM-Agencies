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
    Package
} from 'lucide-react';

const Users = () => {
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'performance'
    const [users, setUsers] = useState([]);
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'sales_rep', phone: '' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else {
            fetchPerformanceData();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
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
            'admin': 'bg-red-100 text-red-800 border-red-200',
            'sales_rep': 'bg-emerald-100 text-emerald-800 border-emerald-200',
            'driver': 'bg-blue-100 text-blue-800 border-blue-200',
            'collection_agent': 'bg-amber-100 text-amber-800 border-amber-200'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
                {role.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    return (
        <div className="animate-fade-in-up space-y-8 p-2">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Team Management</h1>
                    <p className="text-slate-500 mt-1">Manage users and track sales performance</p>
                </div>

                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <UsersIcon size={16} /> Users
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'performance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <TrendingUp size={16} /> Performance
                    </button>
                </div>
            </header>

            {activeTab === 'users' && (
                <>
                    <div className="flex justify-end">
                        <button
                            onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ name: '', email: '', password: '', role: 'sales_rep', phone: '' }); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-blue-200 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> Add User
                        </button>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-slate-400">Loading users...</td></tr>
                                ) : users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                                        <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-3">
                                            <button onClick={() => startEdit(user)} className="text-slate-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(user.id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'performance' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Performer Card */}
                        {performanceData.length > 0 && (
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-indigo-100 font-medium uppercase tracking-wider text-xs mb-2">Top Performer Today</p>
                                    <h2 className="text-3xl font-extrabold mb-1">{performanceData[0].name}</h2>
                                    <p className="text-indigo-100 text-sm opacity-90">
                                        ₹{Number(performanceData[0].salesToday).toLocaleString()} sales | {performanceData[0].ordersToday} orders
                                    </p>
                                </div>
                                <Award className="absolute -right-4 -bottom-4 text-white/20" size={100} />
                            </div>
                        )}
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800">Sales Representatives Activity</h3>
                        </div>
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Representative</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Orders Today</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Sales Today</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Total Orders</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Sales</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading performance data...</td></tr>
                                ) : performanceData.map((rep, idx) => (
                                    <tr key={rep.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-300'}`}>
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{rep.name}</p>
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
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                                            ₹{Number(rep.salesToday).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600">
                                            {rep.totalOrders}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600">
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
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in-up">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-slate-800">{editingId ? 'Edit User' : 'New User'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                                <input type="email" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            {!editingId && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
                                    <input type="password" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Role</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
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
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md shadow-blue-200 transition-all hover:scale-105">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
