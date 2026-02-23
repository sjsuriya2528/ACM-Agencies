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
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_STYLES = {
    Pending: 'bg-amber-100 text-amber-700 border-amber-200',
    Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Rejected: 'bg-red-100 text-red-700 border-red-200',
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
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterMode, setFilterMode] = useState('All');
    const [error, setError] = useState(null);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [searchInvoice, setSearchInvoice] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({ amount: '', paymentMode: 'Cash', transactionId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // paymentId being actioned

    useEffect(() => { fetchPayments(); }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/payments');
            setPayments(response.data);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to fetch payments.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingInvoices = async () => {
        try {
            setLoadingInvoices(true);
            const response = await api.get('/invoices?status=Pending');
            setInvoices(response.data);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        } finally {
            setLoadingInvoices(false);
        }
    };

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
            await api.post('/payments', {
                invoiceId: selectedInvoice.id,
                amount: paymentData.amount,
                paymentMode: paymentData.paymentMode,
                transactionId: paymentData.transactionId,
            });
            setShowRecordModal(false);
            setSelectedInvoice(null);
            setPaymentData({ amount: '', paymentMode: 'Cash', transactionId: '' });
            alert('Payment recorded successfully!');
            fetchPayments();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to record payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredPayments = payments.filter(p => {
        const matchSearch =
            (p.Invoice?.Order?.retailer?.shopName || p.retailerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.collectedBy?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'All' || p.approvalStatus === filterStatus;
        const matchMode = filterMode === 'All' || p.paymentMode === filterMode;
        return matchSearch && matchStatus && matchMode;
    });

    const pendingCount = payments.filter(p => p.approvalStatus === 'Pending').length;
    const totalApproved = payments
        .filter(p => p.approvalStatus === 'Approved')
        .reduce((sum, p) => sum + Number(p.amount), 0);

    if (loading) return <LoadingSpinner />;

    if (error) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-red-500 font-semibold">{error}</p>
            <button onClick={fetchPayments} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
        </div>
    );

    return (
        <div className="animate-fade-in-up space-y-8 p-2">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Payments</h1>
                    <p className="text-slate-500 mt-1">Review, approve, and manage employee collections</p>
                </div>

                <div className="flex gap-4 flex-wrap">
                    {/* Pending Badge */}
                    {pendingCount > 0 && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
                            <Clock size={18} />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-500">Awaiting Approval</p>
                                <p className="text-xl font-black">{pendingCount}</p>
                            </div>
                        </div>
                    )}
                    {/* Total Approved */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-lg shadow-emerald-200 min-w-[180px]">
                        <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Collected</p>
                        <div className="flex items-center gap-2">
                            <IndianRupee size={22} />
                            <span className="text-2xl font-bold">{totalApproved.toLocaleString()}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => { setShowRecordModal(true); fetchPendingInvoices(); }}
                        className="bg-slate-900 text-white px-6 py-4 rounded-2xl flex items-center gap-2 hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                        <Plus size={20} /> Record Payment
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between flex-wrap">
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search retailer, collector..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 flex-wrap">
                    {/* Approval Status Filter */}
                    <div className="bg-slate-100 p-1 rounded-xl flex">
                        {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filterStatus === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {s} {s === 'Pending' && pendingCount > 0 && <span className="ml-1 bg-amber-500 text-white rounded-full px-1.5 text-[10px]">{pendingCount}</span>}
                            </button>
                        ))}
                    </div>
                    {/* Payment Mode Filter */}
                    <div className="bg-slate-100 p-1 rounded-xl flex">
                        {['All', 'Cash', 'UPI', 'Cheque'].map(m => (
                            <button
                                key={m}
                                onClick={() => setFilterMode(m)}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filterMode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Retailer</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Mode</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Collected By</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredPayments.length > 0 ? filteredPayments.map(payment => {
                            const status = payment.approvalStatus || 'Approved';
                            const isActioning = actionLoading === payment.id;

                            return (
                                <tr key={payment.id} className={`hover:bg-slate-50/50 transition-colors ${status === 'Pending' ? 'bg-amber-50/30' : ''}`}>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <Calendar size={14} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">
                                                {(() => {
                                                    const raw = payment.paymentDate || payment.createdAt;
                                                    const [y, m, d] = (raw || '').slice(0, 10).split('-').map(Number);
                                                    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                })()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Store size={14} className="text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {payment.Invoice?.Order?.retailer?.shopName || payment.retailerName || 'Unknown Shop'}
                                                </p>
                                                <p className="text-xs text-slate-400">Invoice #{payment.invoiceId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`font-bold text-sm ${status === 'Approved' ? 'text-emerald-600' : status === 'Rejected' ? 'text-slate-400 line-through' : 'text-amber-600'}`}>
                                            {status === 'Approved' ? '+' : ''}₹{Number(payment.amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${payment.paymentMode === 'Cash' ? 'bg-green-100 text-green-700' : payment.paymentMode === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {payment.paymentMode}
                                        </span>
                                        {payment.transactionId && <p className="text-xs text-slate-400 mt-1 font-mono">{payment.transactionId}</p>}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-400" />
                                            <div>
                                                <span className="text-sm text-slate-700 font-medium">{payment.collectedBy?.name || 'System'}</span>
                                                <p className="text-[10px] text-slate-400 capitalize">{payment.collectedBy?.role || ''}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[status] || STATUS_STYLES.Approved}`}>
                                            {STATUS_ICONS[status]}
                                            {status}
                                        </span>
                                        {payment.approvalNote && (
                                            <p className="text-[10px] text-slate-400 mt-1 italic">"{payment.approvalNote}"</p>
                                        )}
                                    </td>
                                    <td className="p-5 text-right">
                                        {isActioning ? (
                                            <div className="flex justify-end"><div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
                                        ) : (
                                            <div className="flex justify-end gap-2">
                                                {status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(payment.id, 'approve')}
                                                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors font-bold text-xs flex items-center gap-1"
                                                            title="Approve"
                                                        >
                                                            <ThumbsUp size={15} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(payment.id, 'reject')}
                                                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors font-bold text-xs flex items-center gap-1"
                                                            title="Reject"
                                                        >
                                                            <ThumbsDown size={15} /> Reject
                                                        </button>
                                                    </>
                                                )}
                                                {status === 'Approved' && (
                                                    <button
                                                        onClick={() => handleAction(payment.id, 'cancel')}
                                                        className="p-2 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-bold text-xs flex items-center gap-1"
                                                        title="Cancel (revert invoice)"
                                                    >
                                                        <RotateCcw size={14} /> Cancel
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="7" className="p-12 text-center text-slate-400">
                                    No payments found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Record New Payment Modal */}
            {showRecordModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 pt-10 md:pt-20 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Record New Payment</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Admin-recorded payments are approved immediately</p>
                            </div>
                            <button onClick={() => setShowRecordModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            {/* Invoice Selection */}
                            <div className="p-6 border-r border-slate-100 bg-slate-50/30">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">1. Select Invoice</label>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search retailer or bill #..."
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100"
                                        value={searchInvoice}
                                        onChange={e => setSearchInvoice(e.target.value)}
                                    />
                                </div>
                                <div className="h-[300px] overflow-y-auto space-y-2 pr-2">
                                    {loadingInvoices ? (
                                        <div className="flex justify-center py-10"><LoadingSpinner /></div>
                                    ) : invoices.filter(inv =>
                                        (inv.Order?.retailer?.shopName || '').toLowerCase().includes(searchInvoice.toLowerCase()) ||
                                        inv.id.toString().includes(searchInvoice)
                                    ).map(invoice => (
                                        <button
                                            key={invoice.id}
                                            onClick={() => { setSelectedInvoice(invoice); setPaymentData({ ...paymentData, amount: invoice.balanceAmount }); }}
                                            className={`w-full text-left p-3 rounded-xl border transition-all ${selectedInvoice?.id === invoice.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 hover:border-blue-200 text-slate-700'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className={`text-xs font-black uppercase tracking-wider ${selectedInvoice?.id === invoice.id ? 'text-blue-100' : 'text-slate-400'}`}>Bill #{invoice.id}</p>
                                                    <p className="font-bold truncate max-w-[180px]">{invoice.Order?.retailer?.shopName || 'Wholesale Order'}</p>
                                                </div>
                                                <p className={`font-black ${selectedInvoice?.id === invoice.id ? 'text-white' : 'text-slate-800'}`}>₹{parseFloat(invoice.balanceAmount).toLocaleString()}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Form */}
                            <div className="p-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">2. Payment Details</label>
                                {selectedInvoice ? (
                                    <form onSubmit={handleRecordPayment} className="space-y-4">
                                        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex justify-between items-center mb-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Selected Balance</p>
                                                <p className="text-xl font-black text-blue-700">₹{parseFloat(selectedInvoice.balanceAmount).toLocaleString()}</p>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg"><CreditCard className="text-blue-500" size={20} /></div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Amount</label>
                                            <input type="number" step="0.01" required value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 font-bold text-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Payment Mode</label>
                                            <select value={paymentData.paymentMode} onChange={e => setPaymentData({ ...paymentData, paymentMode: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 text-sm font-semibold text-slate-700">
                                                <option>Cash</option>
                                                <option>UPI</option>
                                                <option>Bank Transfer</option>
                                                <option>Cheque</option>
                                            </select>
                                        </div>
                                        {paymentData.paymentMode !== 'Cash' && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Reference ID</label>
                                                <input type="text" value={paymentData.transactionId} onChange={e => setPaymentData({ ...paymentData, transactionId: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-100 text-sm font-medium text-slate-700" placeholder="Transaction/Ref No" />
                                            </div>
                                        )}
                                        <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-white font-bold transition-all shadow-lg mt-6 ${isSubmitting ? 'bg-slate-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
                                            {isSubmitting ? 'Recording...' : <><CheckCircle size={18} /> Record & Approve</>}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="p-4 bg-slate-50 rounded-full text-slate-200"><IndianRupee size={48} /></div>
                                        <p className="text-slate-400 text-sm font-medium">Select an invoice from the left list.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
