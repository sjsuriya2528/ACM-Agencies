import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Filter, ChevronRight, Clock, CheckCircle, XCircle, FileText, Calendar } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ViewOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            const fetchOrders = async (signal) => {
                try {
                    const params = {};
                    if (startDate) params.startDate = startDate;
                    if (endDate) params.endDate = endDate;
                    const response = await api.get('/orders', { params, signal });
                    setOrders(response.data.data || []);
                } catch (error) {
                    if (error.name === 'CanceledError' || error.name === 'AbortError') return;
                    console.error("Failed to fetch orders", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchOrders(controller.signal);
        }, 300); // 300ms debounce

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [startDate, endDate]);

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.retailer?.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toString().includes(searchTerm);
        const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Requested': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle size={14} className="mr-1" />;
            case 'Rejected': return <XCircle size={14} className="mr-1" />;
            default: return <Clock size={14} className="mr-1" />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-30 px-4 py-3 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">My Orders</h1>
                </div>

                {/* Search & Status Filter */}
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search retailer or ID..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold transition-all focus:bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <select
                                className="appearance-none bg-slate-100 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer h-full"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Requested">Requested</option>
                                <option value="Approved">Accepted</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Date Filter Toggle/Group */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex-1 flex items-center bg-white rounded-lg px-2 border border-slate-100">
                                <Calendar size={14} className="text-slate-400 mr-2" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none text-[10px] font-bold text-slate-700 focus:ring-0 p-1.5 w-full uppercase"
                                />
                            </div>
                            <span className="text-slate-400 font-bold">→</span>
                            <div className="flex-1 flex items-center bg-white rounded-lg px-2 border border-slate-100">
                                <Calendar size={14} className="text-slate-400 mr-2" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none text-[10px] font-bold text-slate-700 focus:ring-0 p-1.5 w-full uppercase"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-all ml-1"
                                >
                                    <XCircle size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Order List */}
            <div className="p-4 space-y-4 max-w-lg mx-auto">
                {loading ? (
                    <LoadingSpinner />
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order, index) => (
                        <div
                            key={order.id}
                            onClick={() => navigate(`/orders/${order.id}`)} // Route needs to exist or be handled
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-transform animate-fade-in-up cursor-pointer hover:shadow-md group relative overflow-hidden"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{order.retailer?.shopName || 'Unknown Retailer'}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{order.id}</span>
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <span className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    {order.status === 'Approved' ? 'Accepted' : order.status}
                                </span>
                            </div>

                            <div className="flex justify-between items-end mt-4 pt-3 border-t border-slate-50 dashed">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Amount</p>
                                    <span className="font-extrabold text-slate-800 text-xl">₹{order.totalAmount}</span>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="p-6 bg-slate-100 rounded-full mb-4">
                            <FileText size={48} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-lg text-slate-600">No orders found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewOrders;
