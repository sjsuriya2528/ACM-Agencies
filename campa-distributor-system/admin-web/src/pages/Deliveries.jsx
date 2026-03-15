import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
    Truck,
    CheckCircle,
    Clock,
    MapPin,
    User,
    Package,
    Search,
    Calendar,
    CreditCard,
    Plus,
    X,
    ChevronLeft,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Deliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDelivery, setSelectedDelivery] = useState(null); // For payment modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        paymentMode: 'Cash',
        transactionId: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [limit, setLimit] = useState(20);
    const [activeSearch, setActiveSearch] = useState('');
    const [counts, setCounts] = useState({ dispatched: 0, delivered: 0 });

    const fetchDeliveries = async (signal) => {
        setLoading(true);
        try {
            const params = {
                status: 'Dispatched,Delivered',
                page,
                limit,
                search: activeSearch
            };
            const response = await api.get('/orders', { params, signal });
            setDeliveries(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.total);

            // Fetch counts for the metrics cards (we can do this by fetching headers/totals or a separate call)
            // For now, let's keep it simple or just use the current page totals if suitable.
            // Ideally a separate lightweight endpoint for counts would be better.
        } catch (error) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') return;
            console.error("Failed to fetch deliveries", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setActiveSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const controller = new AbortController();
        fetchDeliveries(controller.signal);
        return () => controller.abort();
    }, [page, activeSearch]);

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!selectedDelivery || !selectedDelivery.invoice) return;

        const balance = parseFloat(selectedDelivery.invoice.balanceAmount);
        if (parseFloat(paymentData.amount) > balance) {
            alert(`Payment amount cannot exceed balance (₹${balance})`);
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/payments', {
                invoiceId: selectedDelivery.invoice.id,
                amount: paymentData.amount,
                paymentMode: paymentData.paymentMode,
                transactionId: paymentData.transactionId
            });

            setShowPaymentModal(false);
            setPaymentData({ amount: '', paymentMode: 'Cash', transactionId: '' });
            alert("Payment recorded successfully!");
            fetchDeliveries(); // Refresh list to update balances
        } catch (error) {
            console.error("Failed to record payment", error);
            alert(error.response?.data?.message || "Failed to record payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredDeliveries = deliveries;
    // Frontend filtering removed as it's now handled by the server

    // Note: Local counts will only represent the current page. 
    // For a real dashboard, we'd want total counts from the backend.
    if (!Array.isArray(deliveries)) {
        console.warn("Filter warning: 'deliveries' is not an array in Deliveries.jsx. Type:", typeof deliveries, "Value:", deliveries);
    }
    const deliveriesList = Array.isArray(deliveries) ? deliveries : [];
    const activeCount = deliveriesList.filter(d => d.status === 'Dispatched').length;
    const completedCount = deliveriesList.filter(d => d.status === 'Delivered').length;

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in-up space-y-8 p-2">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Delivery Tracking</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Monitor active dispatches and driver performance</p>
            </header>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <p className="text-blue-100/70 font-black uppercase tracking-[0.2em] text-[10px] mb-3">In Transit</p>
                        <h2 className="text-4xl font-black tracking-tight">{activeCount}</h2>
                        <p className="text-sm text-blue-100/90 mt-2 font-medium">Orders currently with drivers</p>
                    </div>
                    <Truck className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition-transform duration-700" size={130} />
                </div>

                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <p className="text-emerald-100/70 font-black uppercase tracking-[0.2em] text-[10px] mb-3">Delivered Today</p>
                        <h2 className="text-4xl font-black tracking-tight">{completedCount}</h2>
                        <p className="text-sm text-emerald-100/90 mt-2 font-medium">Successfully completed deliveries</p>
                    </div>
                    <CheckCircle className="absolute -right-6 -bottom-6 text-white/10 group-hover:scale-110 transition-transform duration-700" size={130} />
                </div>
            </div>

            {/* Delivery List */}
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 transition-colors">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Recent Deliveries</h3>
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search ID, retailer, date..."
                            className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-medium shadow-sm outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>


                <div className="space-y-4">
                    {filteredDeliveries.map(delivery => (
                        <div key={delivery.id} className="group flex flex-col md:flex-row items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/5 ring-1 ring-black/5 dark:ring-white/5">
                            <div className="flex items-center gap-5 w-full md:w-auto mb-5 md:mb-0">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-110 ${delivery.status === 'Dispatched' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/30' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30'
                                    }`}>
                                    {delivery.status === 'Dispatched' ? <Truck size={28} /> : <CheckCircle size={28} />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">#{delivery.id} — {delivery.retailer?.shopName}</h4>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-2 uppercase font-black tracking-widest mt-1">
                                        <Calendar size={12} className="text-blue-500" />
                                        {new Date(delivery.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-10 w-full md:w-auto justify-between md:justify-end">
                                <div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-2 text-center md:text-left">Driver</p>
                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300 font-bold shadow-sm border border-slate-100 dark:border-slate-600">
                                            <User size={14} />
                                        </div>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                            {/* Driver name is mocked here as we assume include user, fix backend if null */}
                                            Driver #{delivery.driverId}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right flex items-center gap-8">
                                    <div className="hidden sm:block">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-2">Status</p>
                                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${delivery.status === 'Dispatched'
                                            ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                                            : 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${delivery.status === 'Dispatched' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                            {delivery.status}
                                        </span>
                                    </div>

                                    {delivery.invoice && delivery.invoice.paymentStatus !== 'Paid' && (
                                        <button
                                            onClick={() => {
                                                setSelectedDelivery(delivery);
                                                setPaymentData({ ...paymentData, amount: delivery.invoice.balanceAmount });
                                                setShowPaymentModal(true);
                                            }}
                                            className="bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 group/btn font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95"
                                            title="Collect Payment"
                                        >
                                            <CreditCard size={18} className="group-hover/btn:scale-110 transition-transform" />
                                            <span>Collect</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredDeliveries.length === 0 && (
                        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-3xl p-16 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3">
                            <Truck size={48} className="opacity-20" />
                            <p className="font-bold uppercase tracking-widest text-xs">No deliveries found</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalResults > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            Showing <span className="text-slate-900 dark:text-slate-100 font-bold">{Math.min(totalResults, (page - 1) * limit + 1)}</span> to{' '}
                            <span className="text-slate-900 dark:text-slate-100 font-bold">{Math.min(totalResults, page * limit)}</span> of{' '}
                            <span className="text-black dark:text-white font-black">{totalResults}</span> deliveries
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white dark:bg-slate-900 shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="flex items-center gap-1.5">
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
                                            className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${page === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={page === totalPages}
                                className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white dark:bg-slate-900 shadow-sm text-slate-600 dark:text-slate-400"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Collection Modal */}
            {showPaymentModal && selectedDelivery && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 pt-10 md:pt-20 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in mb-10 border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Record Payment</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-widest">Order #{selectedDelivery.id} — {selectedDelivery.retailer?.shopName}</p>
                            </div>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="p-8 space-y-6">
                            <div className="bg-blue-600 dark:bg-blue-900/40 rounded-2xl p-6 flex justify-between items-center border border-blue-500/20 shadow-lg shadow-blue-200/50 dark:shadow-none relative overflow-hidden group">
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-blue-100/70 uppercase tracking-[0.2em] mb-1">Bill Balance</p>
                                    <p className="text-3xl font-black text-white">₹{parseFloat(selectedDelivery.invoice?.balanceAmount || 0).toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-white/20 rounded-xl backdrop-blur-md border border-white/20 relative z-10">
                                    <CreditCard className="text-white" size={28} />
                                </div>
                                <Truck className="absolute -right-4 -bottom-4 text-white/5" size={80} />
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Collection Amount</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-black text-lg group-focus-within:text-blue-500 transition-colors">₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                            className="w-full pl-10 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-black text-slate-700 dark:text-slate-100 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Payment Mode</label>
                                    <select
                                        value={paymentData.paymentMode}
                                        onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-sm font-black text-slate-700 dark:text-slate-200 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Cash">CASH</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Bank Transfer">BANK TRANSFER</option>
                                        <option value="Cheque">CHEQUE</option>
                                    </select>
                                </div>

                                {paymentData.paymentMode !== 'Cash' && (
                                    <div className="animate-fade-in">
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Reference / Transaction ID</label>
                                        <input
                                            type="text"
                                            value={paymentData.transactionId}
                                            onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
                                            placeholder="Ref No, UPI ID, etc."
                                        />
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest transition-all shadow-xl text-xs active:scale-[0.98] transform hover:-translate-y-0.5 ${isSubmitting ? 'bg-slate-300 dark:bg-slate-700' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>Recording Payment...</>
                                ) : (
                                    <>
                                        <Plus size={20} /> Record Collection
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Deliveries;
