import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, IndianRupee, Search, FileText, Calendar, ChevronDown, ChevronUp, ChevronRight, CreditCard, Banknote, CheckCircle, AlertCircle, Loader, User, Share2, ShieldCheck, Wallet } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const CollectPayment = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIds, setExpandedIds] = useState([]);
    const [paymentData, setPaymentData] = useState({});
    const [processingId, setProcessingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/invoices?status=Pending');
            setInvoices(response.data);
        } catch (error) {
            console.error("Failed to fetch invoices", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (invoiceId, balanceAmount) => {
        setExpandedIds(prev =>
            prev.includes(invoiceId) ? prev.filter(id => id !== invoiceId) : [...prev, invoiceId]
        );
        if (!paymentData[invoiceId]) {
            setPaymentData(prev => ({
                ...prev,
                [invoiceId]: {
                    amount: balanceAmount,
                    paymentMode: 'Cash',
                    transactionId: ''
                }
            }));
        }
    };

    const handleInputChange = (invoiceId, field, value) => {
        setPaymentData(prev => ({
            ...prev,
            [invoiceId]: {
                ...prev[invoiceId],
                [field]: value
            }
        }));
    };

    const handlePaymentSubmit = async (e, invoiceId, dueAmount) => {
        e.preventDefault();
        const data = paymentData[invoiceId];

        const amount = parseFloat(data.amount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount");
            return;
        }
        if (amount > dueAmount) {
            alert("Amount cannot exceed the due amount");
            return;
        }

        setProcessingId(invoiceId);

        try {
            await api.post('/payments', {
                invoiceId,
                amount: amount,
                paymentMode: data.paymentMode,
                transactionId: data.transactionId
            });
            alert("Payment recorded successfully!");
            // Refresh list
            await fetchInvoices();
            // Clear successful payment data and collapse
            setExpandedIds(prev => prev.filter(id => id !== invoiceId));
        } catch (error) {
            console.error("Payment failed", error);
            alert(error.response?.data?.message || "Failed to record payment");
        } finally {
            setProcessingId(null);
        }
    };

    // Robust name resolution
    const getRetailerName = (inv) => {
        return inv.customerName || inv.Order?.retailer?.shopName || inv.Order?.Retailer?.shopName || 'Unknown Retailer';
    };

    const filteredInvoices = invoices.filter(inv =>
        (getRetailerName(inv).toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.id.toString().includes(searchTerm)) &&
        (inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partially Paid') &&
        (inv.Order?.status === 'Delivered')
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-100 px-5 pt-8 pb-6 rounded-b-[2.5rem]">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-slate-50 rounded-2xl text-slate-600 hover:bg-white hover:shadow-md transition-all border border-slate-100"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Collect Payment</h1>
                        <div className="w-11"></div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search by retailer or bill #"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-500/5 focus:outline-none font-bold text-slate-700 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Invoices List */}
            <div className="px-5 py-8 max-w-7xl mx-auto space-y-5">
                {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice, index) => {
                        const isExpanded = expandedIds.includes(invoice.id);
                        const balance = parseFloat(invoice.balanceAmount || invoice.netTotal);
                        const retailerName = getRetailerName(invoice);

                        return (
                            <div
                                key={invoice.id}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`bg-white rounded-[2rem] shadow-lg border transition-all duration-300 overflow-hidden animate-fade-in-up ${isExpanded ? 'ring-2 ring-emerald-500 border-transparent shadow-2xl' : 'border-slate-100 hover:shadow-xl'}`}
                            >
                                {/* Card Header / Summary */}
                                <div
                                    onClick={() => toggleExpand(invoice.id, balance)}
                                    className="p-6 cursor-pointer relative"
                                >
                                    {/* Gradient Accent Bar */}
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-emerald-500 to-teal-600"></div>

                                    <div className="flex justify-between items-start pl-3 mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-slate-100">
                                                    Bill #{invoice.id}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(invoice.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="font-extrabold text-slate-800 text-xl leading-snug tracking-tight">
                                                {retailerName}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Amount</p>
                                            <p className="font-black text-emerald-600 text-2xl tracking-tighter">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                                        </div>
                                    </div>

                                    {/* Expansion Indicator */}
                                    <div className="flex justify-center flex-col items-center gap-2">
                                        <div className="w-8 h-1 bg-slate-100 rounded-full"></div>
                                        {!isExpanded && (
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                                                Tap to Record Payment
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <div className={`bg-slate-50/50 px-6 transition-all duration-500 ease-in-out border-t border-slate-50 ${isExpanded ? 'max-h-[1000px] py-8 opacity-100' : 'max-h-0 py-0 opacity-0 overflow-hidden'}`}>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Quick Summary View */}
                                        <div className="space-y-4">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/invoice/${invoice.id}`); }}
                                                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all group"
                                            >
                                                <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                                                        <FileText size={18} />
                                                    </div>
                                                    Explore Full Invoice
                                                </div>
                                                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                            </button>

                                            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-400 font-bold">Total Bill</span>
                                                    <span className="font-black text-slate-800">₹{parseFloat(invoice.totalAmount).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-400 font-bold">Paid So Far</span>
                                                    <span className="font-black text-emerald-600">₹{(invoice.totalAmount - invoice.balanceAmount).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Collection History Audit Trail */}
                                            {invoice.Payments && invoice.Payments.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Collection History</h4>
                                                    <div className="bg-white/50 rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                                                        {invoice.Payments.map((p, i) => (
                                                            <div key={i} className="p-3 flex items-center justify-between text-xs">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                                                        {p.collectedBy?.name?.charAt(0) || 'U'}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-slate-700">{p.collectedBy?.name || 'Unknown'}</p>
                                                                        <p className="text-[9px] text-slate-400">{new Date(p.createdAt).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                                <span className="font-black text-slate-800">₹{parseFloat(p.amount).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment Form */}
                                        <form onSubmit={(e) => handlePaymentSubmit(e, invoice.id, balance)} className="space-y-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Payment Mode</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['Cash', 'UPI', 'Cheque'].map(mode => (
                                                            <button
                                                                key={mode}
                                                                type="button"
                                                                onClick={() => handleInputChange(invoice.id, 'paymentMode', mode)}
                                                                className={`py-4 rounded-2xl text-xs font-black border transition-all flex flex-col items-center gap-2 ${paymentData[invoice.id]?.paymentMode === mode
                                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]'
                                                                    : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                                                            >
                                                                {mode === 'Cash' && <Banknote size={20} />}
                                                                {mode === 'UPI' && <Wallet size={20} />}
                                                                {mode === 'Cheque' && <CreditCard size={20} />}
                                                                {mode}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Collection Amount</label>
                                                    <div className="relative group">
                                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                                        <input
                                                            type="number"
                                                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-100 font-black text-slate-800 transition-all text-lg"
                                                            value={paymentData[invoice.id]?.amount || ''}
                                                            onChange={(e) => handleInputChange(invoice.id, 'amount', e.target.value)}
                                                            max={balance}
                                                        />
                                                    </div>
                                                </div>

                                                {paymentData[invoice.id]?.paymentMode !== 'Cash' && (
                                                    <div className="animate-fade-in-up">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Reference / Trans ID</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-100 font-bold text-slate-800 transition-all"
                                                            placeholder={`Enter ${paymentData[invoice.id]?.paymentMode} Ref #`}
                                                            value={paymentData[invoice.id]?.transactionId || ''}
                                                            onChange={(e) => handleInputChange(invoice.id, 'transactionId', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={processingId === invoice.id}
                                                    className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-emerald-100/50 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                                                >
                                                    {processingId === invoice.id ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck size={22} /> Confirm Receipt
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-6 border border-slate-50">
                            <CheckCircle size={48} className="text-emerald-500" />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-2 tracking-tight">Zero Pendency!</h3>
                        <p className="text-slate-400 font-medium max-w-[260px] leading-relaxed italic">All scheduled payments for today have been successfully accounted for.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollectPayment;
