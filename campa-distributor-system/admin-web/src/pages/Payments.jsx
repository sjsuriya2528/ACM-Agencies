import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    CreditCard,
    Search,
    Calendar,
    User,
    Store,
    IndianRupee,
    Plus,
    X,
    CheckCircle,
    XCircle,
    RotateCcw,
    Clock,
    ThumbsUp,
    ThumbsDown,
    Printer,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentReceipt from '../components/PaymentReceipt';

const STATUS_STYLES = {
    Pending: 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    Approved: 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    Rejected: 'bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50',
};

const STATUS_ICONS = {
    Pending: <Clock size={12} />,
    Approved: <CheckCircle size={12} />,
    Rejected: <XCircle size={12} />,
};

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState(''); // Search term actually used for fetch
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterMode, setFilterMode] = useState('All');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [totalApprovedAmount, setTotalApprovedAmount] = useState(0);
    const [totalPendingCount, setTotalPendingCount] = useState(0);
    const [limit, setLimit] = useState(50);
    const [error, setError] = useState(null);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [searchInvoice, setSearchInvoice] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({ amount: '', paymentMode: 'Cash', transactionId: '', paymentDate: new Date().toISOString().split('T')[0] });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // paymentId being actioned
    const [receiptData, setReceiptData] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => { fetchPayments(); }, [page, filterStatus, filterMode, activeSearch]);

    // Handle search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setActiveSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/payments', {
                params: {
                    page,
                    limit,
                    status: filterStatus,
                    mode: filterMode,
                    search: activeSearch
                }
            });
            setPayments(response.data.data);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.total);
            setTotalApprovedAmount(response.data.totalApprovedAmount || 0);
            setTotalPendingCount(response.data.totalPendingCount || 0);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch payments.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingInvoices = async (search = '') => {
        try {
            setLoadingInvoices(true);
            const response = await api.get('/invoices', {
                params: {
                    status: 'Pending',
                    search: search
                }
            });
            setInvoices(response.data);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        } finally {
            setLoadingInvoices(false);
        }
    };

    // Debounce invoice search in modal
    useEffect(() => {
        if (!showRecordModal) return;
        const timer = setTimeout(() => {
            fetchPendingInvoices(searchInvoice);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInvoice, showRecordModal]);

    const handleAction = async (id, action) => {
        const confirmMessages = {
            approve: 'Approve this payment? The invoice balance will be updated.',
            reject: 'Reject this payment? No changes to the invoice.',
            cancel: 'Cancel this approved payment? The invoice balance will be reverted.',
        };
        if (!window.confirm(confirmMessages[action])) return;

        setActionLoading(id);
        try {
            await api.patch(`/payments/${id}/${action}`);
            await fetchPayments();
        } catch (error) {
            alert(error.response?.data?.message || `Failed to ${action} payment`);
        } finally {
            setActionLoading(null);
        }
    };

    const handlePrintReceipt = async (paymentId) => {
        setIsPrinting(true);
        try {
            const response = await api.get(`/payments/${paymentId}/receipt`);
            setReceiptData(response.data);
            // Small delay to ensure component has rendered with data
            setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 500);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to fetch receipt data');
            setIsPrinting(false);
        }
    };

    const handleBulkApprove = async () => {
        if (!window.confirm(`Approve all ${pendingCount} pending payments? This will update all related invoice balances.`)) return;

        setIsSubmitting(true);
        try {
            await api.patch('/payments/bulk-approve');
            alert('All pending payments approved successfully!');
            fetchPayments();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to bulk approve payments');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        const balance = parseFloat(selectedInvoice.balanceAmount);
        if (parseFloat(paymentData.amount) > balance) {
            alert(`Payment amount cannot exceed balance (₹${balance})`);
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await api.post('/payments', {
                invoiceId: selectedInvoice.id,
                amount: paymentData.amount,
                paymentMode: paymentData.paymentMode,
                transactionId: paymentData.transactionId,
                paymentDate: paymentData.paymentDate,
            });
            setShowRecordModal(false);
            setSelectedInvoice(null);
            setPaymentData({ amount: '', paymentMode: 'Cash', transactionId: '', paymentDate: new Date().toISOString().split('T')[0] });

            if (window.confirm('Payment recorded successfully! Do you want to print the receipt?')) {
                handlePrintReceipt(response.data.id);
            }

            fetchPayments();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to record payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    // For counts across all pages, we get it from the backend
    const pendingCount = totalPendingCount;
    const totalApproved = totalApprovedAmount;

    if (loading) return <LoadingSpinner />;

    if (error) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-red-500 font-semibold">{error}</p>
            <button onClick={fetchPayments} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
        </div>
    );

    return (
        <div className="animate-fade-in-up space-y-8 p-2">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Payments</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Review, approve, and manage employee collections</p>
            </header>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex gap-4 flex-wrap w-full lg:w-auto">
                    {/* Pending Badge */}
                    {pendingCount > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm transition-colors">
                            <Clock size={20} className="animate-pulse" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-500/80 mb-0.5">Pending Approval</p>
                                <p className="text-2xl font-black">{pendingCount}</p>
                            </div>
                        </div>
                    )}
                    {/* Total Approved */}
                    <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 min-w-[200px] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <p className="text-emerald-100/70 text-[10px] font-black uppercase tracking-widest mb-1.5">Total Collected</p>
                            <div className="flex items-center gap-2">
                                <IndianRupee size={24} className="text-emerald-200" />
                                <span className="text-3xl font-black tracking-tight">{totalApproved.toLocaleString()}</span>
                            </div>
                        </div>
                        <IndianRupee size={80} className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                </div>

                <div className="flex gap-4 flex-wrap w-full lg:w-auto">
                    {pendingCount > 0 && (
                        <button
                            onClick={handleBulkApprove}
                            disabled={isSubmitting}
                            className={`flex-1 lg:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-xl shadow-emerald-200 dark:shadow-none transition-all active:scale-95 group font-black text-xs uppercase tracking-widest ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <ThumbsUp size={20} className="group-hover:scale-110 transition-transform" /> Bulk Approve All
                        </button>
                    )}

                    <button
                        onClick={() => { setShowRecordModal(true); fetchPendingInvoices(); }}
                        className="flex-1 lg:flex-none bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-95 group font-black text-xs uppercase tracking-widest"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Record Payment
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-center justify-between flex-wrap transition-colors">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search ID, retailer, collector, date..."
                        className="w-full pl-11 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all font-medium outline-none"
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

                <div className="flex gap-4 flex-wrap">
                    {/* Approval Status Filter */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl flex border border-slate-100 dark:border-slate-700/50">
                        {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                            >
                                {s} {s === 'Pending' && pendingCount > 0 && <span className="ml-1 bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-[8px] animate-pulse">{pendingCount}</span>}
                            </button>
                        ))}
                    </div>
                    {/* Payment Mode Filter */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl flex border border-slate-100 dark:border-slate-700/50">
                        {['All', 'Cash', 'UPI', 'Cheque'].map(m => (
                            <button
                                key={m}
                                onClick={() => setFilterMode(m)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === m ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Retailer</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mode</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Collected By</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {payments.length > 0 ? payments.map(payment => {
                                const status = payment.approvalStatus || 'Approved';
                                const isActioning = actionLoading === payment.id;

                                return (
                                    <tr key={payment.id} className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${status === 'Pending' ? 'bg-amber-50/20 dark:bg-amber-900/10' : ''}`}>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                                                    <Calendar size={16} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                                                    {(() => {
                                                        const raw = payment.paymentDate || payment.createdAt;
                                                        if (!raw) return '—';
                                                        const dateStr = raw.includes('T') ? raw.split('T')[0] : raw;
                                                        const [y, m, d] = dateStr.split('-').map(Number);
                                                        return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                    })()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors">
                                                    <Store size={16} className="text-slate-500 dark:text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                                        {payment.invoice?.order?.retailer?.shopName || payment.retailerName || 'Unknown Shop'}
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                        <IndianRupee size={10} /> Bill #{payment.invoiceId}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`font-black text-sm tabular-nums ${status === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' : status === 'Rejected' ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-amber-600 dark:text-amber-400'}`}>
                                                {status === 'Approved' ? '+' : ''}₹{Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${payment.paymentMode === 'Cash' ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : payment.paymentMode === 'UPI' ? 'bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50' : 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'}`}>
                                                {payment.paymentMode}
                                            </span>
                                            {payment.transactionId && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono uppercase font-medium truncate max-w-[120px]" title={payment.transactionId}>{payment.transactionId}</p>}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <span className="text-sm text-slate-800 dark:text-slate-200 font-bold">{payment.collectedBy?.name || 'System'}</span>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{payment.collectedBy?.role || 'Admin'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${STATUS_STYLES[status] || STATUS_STYLES.Approved}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${status === 'Pending' ? 'bg-amber-500 animate-pulse' : status === 'Approved' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                {status}
                                            </span>
                                            {payment.approvalNote && (
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">"{payment.approvalNote}"</p>
                                            )}
                                        </td>
                                        <td className="p-6 text-right">
                                            {isActioning ? (
                                                <div className="flex justify-end"><div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
                                            ) : (
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {status === 'Pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(payment.id, 'approve')}
                                                                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100 active:scale-95"
                                                                title="Approve"
                                                            >
                                                                <ThumbsUp size={14} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(payment.id, 'reject')}
                                                                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-red-200 dark:border-red-800/50 active:scale-95"
                                                                title="Reject"
                                                            >
                                                                <ThumbsDown size={14} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {status === 'Approved' && (
                                                        <>
                                                            <button
                                                                onClick={() => handlePrintReceipt(payment.id)}
                                                                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-blue-200 dark:border-blue-800/50 active:scale-95"
                                                                title="Print Receipt"
                                                            >
                                                                <Printer size={14} /> Print
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(payment.id, 'cancel')}
                                                                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-slate-200 dark:border-slate-700 active:scale-95"
                                                                title="Cancel (revert invoice)"
                                                            >
                                                                <RotateCcw size={14} /> Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center text-slate-400 dark:text-slate-500 transition-colors">
                                        <div className="flex flex-col items-center gap-4">
                                            <CreditCard size={48} className="opacity-20" />
                                            <p className="font-black uppercase tracking-widest text-xs">No payments found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalResults > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-4 bg-white dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Showing <span className="text-slate-900 dark:text-slate-100 font-bold">{Math.min(totalResults, (page - 1) * limit + 1)}</span> to{' '}
                        <span className="text-slate-900 dark:text-slate-100 font-bold">{Math.min(totalResults, page * limit)}</span> of{' '}
                        <span className="text-black dark:text-white font-black">{totalResults}</span> payments
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
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
                                        className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${page === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && page < totalPages - 2 && <span className="px-2 text-slate-400">...</span>}
                        </div>

                        <button
                            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={page === totalPages}
                            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm text-slate-600 dark:text-slate-400"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Record New Payment Modal */}
            {showRecordModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 pt-10 md:pt-20 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden mb-10 border border-slate-200 dark:border-slate-800 animate-scale-in">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Record New Payment</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-black tracking-widest">Admin-recorded payments are approved immediately</p>
                            </div>
                            <button onClick={() => setShowRecordModal(false)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            {/* Invoice Selection */}
                            <div className="p-8 border-r border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-1">1. Select Invoice</label>
                                <div className="relative mb-6 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search retailer or bill #..."
                                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all dark:text-slate-100"
                                        value={searchInvoice}
                                        onChange={e => setSearchInvoice(e.target.value)}
                                    />
                                </div>
                                <div className="h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                                    {loadingInvoices ? (
                                        <div className="flex justify-center py-10"><LoadingSpinner /></div>
                                    ) : invoices.map(invoice => (
                                        <button
                                            key={invoice.id}
                                            onClick={() => { setSelectedInvoice(invoice); setPaymentData({ ...paymentData, amount: invoice.balanceAmount }); }}
                                            className={`w-full text-left p-5 rounded-2xl border transition-all transform active:scale-[0.98] ${selectedInvoice?.id === invoice.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500/50 text-slate-700 dark:text-slate-200'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${selectedInvoice?.id === invoice.id ? 'text-blue-100/70' : 'text-slate-400 dark:text-slate-500'}`}>Bill #{invoice.id}</p>
                                                    <p className="font-black text-sm tracking-tight truncate max-w-[180px]">{invoice.order?.retailer?.shopName || 'Wholesale Order'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-black text-lg tabular-nums ${selectedInvoice?.id === invoice.id ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>₹{parseFloat(invoice.balanceAmount).toLocaleString()}</p>
                                                    <p className={`text-[10px] font-bold uppercase ${selectedInvoice?.id === invoice.id ? 'text-blue-100/50' : 'text-slate-400'}`}>Balance</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                    {!loadingInvoices && invoices.length === 0 && (
                                        <div className="text-center py-20 text-slate-400 dark:text-slate-600">
                                            <Search size={32} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-xs font-black uppercase tracking-widest">No pending invoices</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Form */}
                            <div className="p-8 bg-white dark:bg-slate-900">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-8 ml-1">2. Payment Details</label>
                                {selectedInvoice ? (
                                    <form onSubmit={handleRecordPayment} className="space-y-6">
                                        <div className="bg-blue-600 dark:bg-blue-900/40 rounded-3xl p-6 flex justify-between items-center border border-blue-500/20 shadow-xl shadow-blue-100 dark:shadow-none relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-black text-blue-100/70 uppercase tracking-[0.2em] mb-1">Selected Balance</p>
                                                <p className="text-3xl font-black text-white">₹{parseFloat(selectedInvoice.balanceAmount).toLocaleString()}</p>
                                            </div>
                                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 relative z-10">
                                                <CreditCard className="text-white" size={28} />
                                            </div>
                                            <IndianRupee className="absolute -right-4 -bottom-4 text-white/5" size={100} />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Payment Date</label>
                                                <div className="relative group">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                                                    <input type="date" required value={paymentData.paymentDate} onChange={e => setPaymentData({ ...paymentData, paymentDate: e.target.value })} className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none font-black text-slate-700 dark:text-slate-100 transition-all text-sm" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Amount (₹)</label>
                                                <div className="relative group">
                                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                                                    <input type="number" step="0.01" required value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none font-black text-slate-700 dark:text-slate-100 transition-all text-sm" />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Payment Mode</label>
                                            <select value={paymentData.paymentMode} onChange={e => setPaymentData({ ...paymentData, paymentMode: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none font-black text-slate-700 dark:text-slate-200 text-sm appearance-none cursor-pointer">
                                                <option>Cash</option>
                                                <option>UPI</option>
                                                <option>Bank Transfer</option>
                                                <option>Cheque</option>
                                            </select>
                                        </div>

                                        {paymentData.paymentMode !== 'Cash' && (
                                            <div className="animate-fade-in">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Reference ID / Trans. No</label>
                                                <input type="text" value={paymentData.transactionId} onChange={e => setPaymentData({ ...paymentData, transactionId: e.target.value })} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none font-bold text-slate-700 dark:text-slate-100 text-sm" placeholder="Ref No, UPI ID, etc." />
                                            </div>
                                        )}

                                        <button type="submit" disabled={isSubmitting} className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest transition-all shadow-xl mt-8 text-xs transform hover:-translate-y-0.5 active:scale-[0.98] ${isSubmitting ? 'bg-slate-300 dark:bg-slate-700' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'}`}>
                                            {isSubmitting ? 'Recording...' : <><CheckCircle size={20} /> Record & Approve</>}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-200 dark:text-slate-700"><IndianRupee size={48} /></div>
                                        <div>
                                            <p className="text-slate-800 dark:text-slate-200 font-black uppercase tracking-widest text-xs">Awaiting Invoice</p>
                                            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 max-w-[200px]">Select an invoice from the list on the left to record a payment.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Component for Printing */}
            {receiptData && <PaymentReceipt data={receiptData} />}
        </div>
    );
};

export default Payments;
