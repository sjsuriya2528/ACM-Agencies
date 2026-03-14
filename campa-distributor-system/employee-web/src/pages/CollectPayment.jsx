import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, IndianRupee, Search, FileText, Calendar, ChevronDown, ChevronUp, ChevronRight, CreditCard, Banknote, CheckCircle, AlertCircle, Loader, User, Share2, ShieldCheck, Wallet, Smartphone } from 'lucide-react';
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
            setInvoices(Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []));
        } catch (error) {
            console.error("Failed to fetch invoices", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (invoiceId, balanceAmount) => {
        setExpandedIds(prev => {
            if (!Array.isArray(prev)) {
                console.warn("Filter warning: 'prev' expandedIds is not an array in CollectPayment. Type:", typeof prev, "Value:", prev);
            }
            const prevList = Array.isArray(prev) ? prev : [];
            return prevList.includes(invoiceId) ? prevList.filter(id => id !== invoiceId) : [...prevList, invoiceId];
        });
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
            alert("✅ Payment submitted for admin approval!\n\nThe invoice balance will update once the admin approves it.");
            // Refresh list
            await fetchInvoices();
            // Clear successful payment data and collapse
            setExpandedIds(prev => {
                if (!Array.isArray(prev)) {
                    console.warn("Filter warning: 'prev' expandedIds is not an array during submit in CollectPayment. Type:", typeof prev, "Value:", prev);
                }
                return (Array.isArray(prev) ? prev : []).filter(id => id !== invoiceId);
            });
        } catch (error) {
            console.error("Payment failed", error);
            alert(error.response?.data?.message || "Failed to record payment");
        } finally {
            setProcessingId(null);
        }
    };

    // Robust name resolution
    const getRetailerName = (inv) => {
        return inv.customerName || inv.order?.retailer?.shopName || inv.order?.retailer?.shopName || 'Unknown Retailer';
    };

    if (!Array.isArray(invoices)) {
        console.warn("Filter warning: 'invoices' is not an array in CollectPayment. Type:", typeof invoices, "Value:", invoices);
    }
    const filteredInvoices = (Array.isArray(invoices) ? invoices : []).filter(inv =>
        (getRetailerName(inv).toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.id.toString().includes(searchTerm)) &&
        (inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partially Paid') &&
        (inv.order?.status === 'Delivered')
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 pb-40">
            {/* Immersive Sticky Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-b border-slate-200 dark:border-white/5 px-6 pt-12 pb-10 rounded-b-[4rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all">
                <div className="max-w-7xl mx-auto space-y-10">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10 active:scale-95 shadow-sm group"
                        >
                            <ArrowLeft size={22} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="text-center">
                            <p className="text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Pending Invoices</p>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Collect Payments</h1>
                        </div>
                        <div className="w-12"></div>
                    </div>

                    {/* High-Precision Search Interface */}
                    <div className="relative group max-w-2xl mx-auto">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={24} strokeWidth={3} />
                        <input
                            type="text"
                            placeholder="SEARCH INVOICES..."
                            className="w-full pl-16 pr-8 py-6 bg-slate-100 dark:bg-black/40 rounded-2xl border border-slate-200 dark:border-white/10 focus:bg-white dark:focus:bg-white/5 focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 focus:outline-none font-black text-slate-900 dark:text-white transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-700 tracking-[0.2em] text-[11px] uppercase placeholder:uppercase"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Pending Invoices List */}
            <div className="px-6 py-12 max-w-3xl mx-auto space-y-10">
                {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice, index) => {
                        const isExpanded = expandedIds.includes(invoice.id);
                        const balance = parseFloat(invoice.balanceAmount || invoice.netTotal);
                        const retailerName = getRetailerName(invoice);

                        return (
                            <div
                                key={invoice.id}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`bg-white dark:bg-white/5 backdrop-blur-3xl rounded-3xl border transition-all duration-300 overflow-hidden relative group ${isExpanded ? 'bg-emerald-50/50 dark:bg-white/10 ring-4 ring-emerald-500/5 border-emerald-500/30 shadow-xl -translate-y-2' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 hover:shadow-lg'}`}
                            >
                                {/* Immersive Card Background Pattern */}
                                {isExpanded && (
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-[100px] animate-pulse"></div>
                                )}

                                {/* Card Header / Summary */}
                                <div
                                    onClick={() => toggleExpand(invoice.id, balance)}
                                    className="p-10 cursor-pointer relative z-10"
                                >
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4">
                                                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-xl border border-emerald-500/20 shadow-inner">
                                                    NODEID: #{invoice.id}
                                                </span>
                                                <div className="flex items-center gap-2 text-[9px] text-slate-700 dark:text-slate-400 font-black uppercase tracking-[0.2em]">
                                                    <Calendar size={14} className="text-emerald-500/30" strokeWidth={3} />
                                                    {new Date(invoice.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <h3 className="font-black text-slate-900 dark:text-white text-3xl leading-tight tracking-tighter uppercase italic group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors max-w-xs">
                                                {retailerName}
                                            </h3>
                                            <div className="flex justify-between items-center px-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-[0.3em]">Total Paid</p>
                                                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">₹{invoice.Payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-[0.4em] mb-2 text-right">BALANCE</p>
                                            <p className="font-black text-slate-900 dark:text-white text-5xl tracking-tighter italic drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] text-right">
                                                <span className="text-emerald-600 dark:text-emerald-500 text-3xl not-italic mr-1">₹</span>
                                                {balance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expansion Intelligence */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 max-w-[120px] h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            {isExpanded && <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-full animate-progress-fast"></div>}
                                        </div>
                                        {!isExpanded && (
                                            <div className="flex items-center gap-4 group/btn">
                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.4em] bg-emerald-500/10 px-8 py-4 rounded-2xl border border-emerald-500/20 shadow-lg transition-all group-hover/btn:bg-emerald-600 group-hover/btn:text-white group-hover/btn:scale-110 active:scale-95">
                                                    Pay Now
                                                </span>
                                                <ChevronDown size={20} className="text-slate-400 dark:text-slate-700 animate-bounce" strokeWidth={3} />
                                            </div>
                                        )}
                                        {isExpanded && <ChevronUp size={24} className="text-emerald-600 dark:text-emerald-500" strokeWidth={3} />}
                                    </div>
                                </div>

                                {/* Expanded Operation Suite */}
                                <div className={`px-10 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) relative z-10 ${isExpanded ? 'max-h-[1500px] py-12 opacity-100 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/40' : 'max-h-0 py-0 opacity-0 overflow-hidden'}`}>

                                    <div className="space-y-12">
                                        {/* Strategic Action Matrix */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <button
                                                onClick={() => window.open(`${api.defaults.baseURL}/invoices/${invoice.id}/pdf`, '_blank')}
                                                className="flex flex-col items-center gap-3 p-6 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 transition-all group"
                                            >
                                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                    <FileText size={24} />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-800 dark:text-slate-400 uppercase tracking-widest">View Bill</span>
                                            </button>
                                            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-inner space-y-6 relative overflow-hidden group/stats">
                                                <div className="flex justify-between items-center relative z-10">
                                                    <span className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em]">Gross Valuation</span>
                                                    <span className="font-black text-white text-xl italic">₹{parseFloat(invoice.totalAmount).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center relative z-10">
                                                    <span className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em]">Total Paid</span>
                                                    <span className="font-black text-emerald-400 text-xl italic">₹{(invoice.totalAmount - invoice.balanceAmount).toLocaleString()}</span>
                                                </div>
                                                <div className="relative h-3 bg-white/5 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400 transition-all duration-2000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                                        style={{ width: `${((invoice.totalAmount - invoice.balanceAmount) / invoice.totalAmount) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-[9px] text-center font-black text-slate-700 uppercase tracking-[0.4em] relative z-10">Paid Percentage: {Math.round(((invoice.totalAmount - invoice.balanceAmount) / invoice.totalAmount) * 100)}%</p>
                                            </div>
                                        </div>

                                        {/* Fragmented Transaction Ledger */}
                                        {invoice.Payments && invoice.Payments.length > 0 && (
                                            <div className="space-y-6">
                                                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] flex items-center gap-3 ml-4">
                                                    <ShieldCheck size={14} className="text-emerald-500" strokeWidth={3} /> Payment History
                                                </h4>
                                                <div className="bg-white/5 rounded-[3.5rem] border border-white/5 divide-y divide-white/5 overflow-hidden shadow-2xl relative">
                                                    {invoice.Payments.map((p, i) => (
                                                        <div key={i} className="p-8 flex items-center justify-between group/p hover:bg-white/5 transition-all">
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-lg font-black text-emerald-400 border border-white/10 shadow-2xl transition-transform group-hover/p:scale-110 group-hover/p:rotate-3 uppercase italic">
                                                                    {p.collectedBy?.name?.charAt(0) || 'U'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-white uppercase text-sm tracking-tight italic group-hover/p:text-emerald-400 transition-colors">{p.collectedBy?.name || 'Unknown User'}</p>
                                                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                                                        <Calendar size={12} className="text-slate-800" />
                                                                        {new Date(p.createdAt).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-black text-white text-2xl tracking-tighter italic">₹{parseFloat(p.amount).toLocaleString()}</p>
                                                                <p className="text-[9px] text-emerald-500/50 font-black uppercase tracking-widest mt-1">Payment Confirmed</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Deployment: Payment Form */}
                                        <form onSubmit={(e) => handlePaymentSubmit(e, invoice.id, balance)} className="space-y-10 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-10 rounded-[4rem] border border-emerald-500/20 shadow-inner relative group/form overflow-hidden">
                                            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] group-hover/form:bg-emerald-500/10 transition-all duration-1000"></div>
                                            
                                            <div className="space-y-10 relative z-10">
                                                <div className="space-y-6">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block ml-6">Select Payment Mode</label>
                                                    <div className="grid grid-cols-3 gap-5">
                                                        {[
                                                            { name: 'Cash', icon: Banknote, color: 'emerald' },
                                                            { name: 'UPI', icon: Wallet, color: 'blue' },
                                                            { name: 'Cheque', icon: CreditCard, color: 'amber' }
                                                        ].map(mode => (
                                                            <button
                                                                key={mode.name}
                                                                type="button"
                                                                onClick={() => handleInputChange(invoice.id, 'paymentMode', mode.name)}
                                                                className={`py-6 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] border transition-all duration-500 flex flex-col items-center gap-4 group/mode ${paymentData[invoice.id]?.paymentMode === mode.name
                                                                    ? 'bg-white text-slate-950 border-white shadow-[0_20px_50px_rgba(255,255,255,0.1)] scale-105 z-20 -translate-y-1'
                                                                    : 'bg-black/40 text-slate-600 border-white/5 hover:bg-white/5 hover:text-slate-400 shadow-inner'}`}
                                                            >
                                                                <mode.icon size={28} strokeWidth={2.5} className={`transition-transform duration-500 ${paymentData[invoice.id]?.paymentMode === mode.name ? 'scale-110' : 'group-hover/mode:scale-110'}`} />
                                                                {mode.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-center ml-6">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Amount (₹)</label>
                                                        <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-xl border border-emerald-500/20">CAP: ₹{balance.toLocaleString()}</span>
                                                    </div>
                                                    <div className="relative group/input">
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-emerald-500/10 text-emerald-400 rounded-[1.8rem] transition-all duration-500 group-focus-within/input:bg-emerald-500 group-focus-within/input:text-white group-focus-within/input:shadow-[0_0_30px_rgba(16,185,129,0.5)] group-focus-within/input:scale-110">
                                                            <IndianRupee size={28} strokeWidth={4} />
                                                        </div>
                                                        <input
                                                            type="number"
                                                            className="w-full pl-28 pr-10 py-10 bg-black/60 border border-white/5 rounded-[3.5rem] focus:outline-none focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/40 font-black text-white transition-all text-5xl tracking-tighter shadow-inner placeholder:text-slate-900"
                                                            value={paymentData[invoice.id]?.amount || ''}
                                                            placeholder="0.00"
                                                            onChange={(e) => handleInputChange(invoice.id, 'amount', e.target.value)}
                                                            max={balance}
                                                        />
                                                    </div>
                                                </div>

                                                {paymentData[invoice.id]?.paymentMode !== 'Cash' && (
                                                    <div className="animate-in fade-in slide-in-from-top-4 duration-700 space-y-6">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block ml-6">Reference Number</label>
                                                        <input
                                                            type="text"
                                                            className="w-full px-10 py-8 bg-black/40 border border-white/5 rounded-[3rem] focus:outline-none focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-500/40 font-black text-white transition-all tracking-[0.2em] text-[11px] shadow-inner placeholder:text-slate-800 uppercase"
                                                            placeholder={`ID: ${paymentData[invoice.id]?.paymentMode} PAY-HASH-XXXX`}
                                                            value={paymentData[invoice.id]?.transactionId || ''}
                                                            onChange={(e) => handleInputChange(invoice.id, 'transactionId', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={processingId === invoice.id}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed p-6 rounded-2xl font-black text-white text-xl uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                                                >
                                                    {processingId === invoice.id ? (
                                                        <div className="w-10 h-10 border-8 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <span>Confirm Payment</span>
                                                            <CheckCircle size={24} strokeWidth={3} />
                                                        </>
                                                    )}
                                                </button>
                                                <p className="text-center text-[9px] font-black text-slate-700 uppercase tracking-[0.6em] animate-pulse">Processing payment...</p>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-56 text-center gap-10">
                        <div className="w-48 h-48 bg-white/5 rounded-[5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex items-center justify-center border border-white/10 animate-in zoom-in-50 duration-1000 relative">
                            <div className="absolute inset-0 bg-emerald-500/5 rounded-full blur-[100px] animate-pulse"></div>
                            <ShieldCheck size={80} className="text-emerald-500/20 relative z-10" strokeWidth={1} />
                            <CheckCircle size={40} className="text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 shadow-2xl" strokeWidth={3} />
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-black text-white text-4xl mb-4 tracking-tighter uppercase italic drop-shadow-2xl">All Clear</h3>
                            <p className="text-slate-600 font-black max-w-[400px] leading-relaxed italic uppercase tracking-[0.4em] text-[10px]">No payments found for this criteria.</p>
                        </div>
                        <button 
                            onClick={() => fetchInvoices()}
                            className="px-10 py-5 bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-[2rem] border border-white/5 hover:bg-white/10 hover:text-white transition-all active:scale-95 shadow-2xl"
                        >
                            Refresh List
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollectPayment;
