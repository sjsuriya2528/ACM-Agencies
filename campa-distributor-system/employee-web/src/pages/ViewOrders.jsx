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
                    setOrders(Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []));
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

    if (!Array.isArray(orders)) {
        console.warn("Filter warning: 'orders' is not an array in ViewOrders. Type:", typeof orders, "Value:", orders);
    }
    const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
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
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 pb-32">
            {/* Immersive Sticky Header */}
            <div className="sticky top-0 z-40 bg-white dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 pt-6 pb-6 rounded-b-2xl shadow-lg transition-all">
                <div className="max-w-7xl mx-auto px-6 space-y-8">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-600 dark:text-slate-400 transition-all border border-slate-200 dark:border-white/10 active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={3} />
                        </button>
                        <div>
                            <p className="text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Database</p>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Order History</h1>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} strokeWidth={2.5} />
                                <input
                                    type="text"
                                    placeholder="SEARCH ORDERS..."
                                    className="w-full pl-14 pr-6 py-5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/10 text-[11px] font-black tracking-widest text-slate-900 dark:text-white transition-all focus:bg-white dark:focus:bg-black/60 focus:border-blue-500/30 placeholder:text-slate-400 dark:placeholder:text-slate-700 uppercase"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative group min-w-[180px]">
                                <select
                                    className="w-full appearance-none bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl pl-6 pr-12 py-5 text-[11px] font-black text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-black/60 transition-all cursor-pointer h-full uppercase tracking-widest focus:border-blue-500/30"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="All" className="bg-white dark:bg-slate-900">ALL STATUS</option>
                                    <option value="Requested" className="bg-white dark:bg-slate-900">PENDING</option>
                                    <option value="Approved" className="bg-white dark:bg-slate-900">APPROVED</option>
                                    <option value="Rejected" className="bg-white dark:bg-slate-900">REJECTED</option>
                                </select>
                                <Filter className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 pointer-events-none" size={16} strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Temporal Constraint Array */}
                        <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 flex items-center bg-white dark:bg-white/5 rounded-xl px-4 border border-slate-200 dark:border-white/5 group focus-within:border-blue-500/30 transition-all">
                                    <Calendar size={14} className="text-slate-500 mr-3" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent border-none text-[10px] font-black text-slate-800 dark:text-slate-300 focus:ring-0 py-3 w-full uppercase tracking-widest"
                                    />
                                </div>
                                <span className="text-slate-400 dark:text-slate-800 font-black tracking-tighter shrink-0 text-[10px]">TO</span>
                                <div className="flex-1 flex items-center bg-white dark:bg-white/5 rounded-xl px-4 border border-slate-200 dark:border-white/5 group focus-within:border-blue-500/30 transition-all">
                                    <Calendar size={14} className="text-slate-500 mr-3" />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent border-none text-[10px] font-black text-slate-800 dark:text-slate-300 focus:ring-0 py-3 w-full uppercase tracking-widest"
                                    />
                                </div>
                                {(startDate || endDate) && (
                                    <button
                                        onClick={() => { setStartDate(''); setEndDate(''); }}
                                        className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20 active:scale-90"
                                    >
                                        <XCircle size={16} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* All Orders */}
            <div className="px-6 py-10 space-y-6 max-w-2xl mx-auto">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 space-y-6">
                        <LoadingSpinner />
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] animate-pulse">Loading Orders...</p>
                    </div>
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order, index) => (
                        <div
                            key={order.id}
                            onClick={() => navigate(`/orders/${order.id}`)}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="bg-white dark:bg-white/5 backdrop-blur-3xl p-8 rounded-3xl border border-slate-200 dark:border-white/10 active:scale-[0.98] transition-all duration-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 group relative overflow-hidden shadow-lg"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 transition-all group-hover:w-2 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"></div>
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="space-y-3">
                                    <h3 className="font-black text-slate-900 dark:text-white text-2xl leading-tight tracking-tighter group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase italic uppercase">{order.retailer?.shopName || 'Unknown Entity'}</h3>
                                    <div className="flex items-center gap-4">
                                        <span className="bg-slate-100 dark:bg-black/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 shadow-inner">UID: #{order.id}</span>
                                        <span className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">
                                            <Calendar size={12} className="text-blue-500/50" strokeWidth={2.5} /> 
                                            {new Date(order.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                                <div className={`flex items-center px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all shadow-2xl ${
                                    order.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5' :
                                    order.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5'
                                }`}>
                                    {getStatusIcon(order.status)}
                                    <span className="ml-2">{order.status === 'Approved' ? 'Approved' : order.status}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mt-10 pt-8 border-t border-slate-100 dark:border-white/5 relative z-10">
                                <div className="group-hover:translate-x-1 transition-transform">
                                    <p className="text-[9px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.3em] mb-2">Order Total</p>
                                    <span className="font-black text-slate-900 dark:text-white text-4xl tracking-tighter italic">₹{order.totalAmount.toLocaleString()}</span>
                                </div>
                                <button className="p-5 bg-white/5 rounded-2xl text-slate-400 group-hover:bg-blue-500 group-hover:text-white group-hover:scale-110 group-hover:rotate-12 transition-all border border-white/5 shadow-xl active:scale-90">
                                    <ChevronRight size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 animate-in fade-in zoom-in-95 duration-700">
                        <div className="w-32 h-32 bg-white/5 rounded-[3rem] shadow-2xl flex items-center justify-center mb-10 border border-white/5 transition-transform hover:-rotate-12 group cursor-none">
                            <FileText size={64} className="text-slate-800 group-hover:text-slate-700 transition-colors" strokeWidth={1} />
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="font-black text-3xl text-slate-900 dark:text-white uppercase tracking-tighter italic">No Orders Found</h3>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] max-w-xs leading-relaxed">Try adjusting your filters.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewOrders;
