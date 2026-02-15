import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, IndianRupee, Search, FileText, Calendar, ChevronDown, ChevronUp, CreditCard, Banknote, CheckCircle, AlertCircle, Loader, Share2 } from 'lucide-react';
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
        (inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partially Paid')
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-24">
            {/* Header */}
            <div className="sticky top-0 bg-slate-50 z-20 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-extrabold text-slate-800">Collect Payment</h1>
                    <div className="w-10"></div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search Retailer or Bill No..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 transition-all focus:shadow-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Invoices List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice, index) => {
                        const isExpanded = expandedIds.includes(invoice.id);
                        const balance = parseFloat(invoice.balanceAmount || invoice.totalAmount);
                        const retailerName = getRetailerName(invoice);

                        return (
                            <div
                                key={invoice.id}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden animate-fade-in-up ${isExpanded ? 'ring-2 ring-blue-500 border-transparent shadow-lg' : 'border-slate-100 hover:shadow-md'}`}
                            >
                                {/* Card Header / Summary */}
                                <div
                                    onClick={() => toggleExpand(invoice.id, balance)}
                                    className="p-5 cursor-pointer relative"
                                >
                                    {/* Gradient Accent */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600"></div>

                                    <div className="flex justify-between items-start pl-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded">
                                                    Bill #{invoice.id}
                                                </span>
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(invoice.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight">
                                                {retailerName}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Due</p>
                                            <p className="font-extrabold text-blue-600 text-xl">₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>

                                    {/* Expansion Indicator */}
                                    <div className="flex justify-center mt-2">
                                        {isExpanded ? (
                                            <ChevronUp size={20} className="text-slate-300" />
                                        ) : (
                                            <div className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full mt-2">
                                                Pay Now <ChevronDown size={14} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <div className={`bg-slate-50 px-5 transition-all duration-300 ease-in-out border-t border-slate-100 ${isExpanded ? 'max-h-[800px] py-6 opacity-100' : 'max-h-0 py-0 opacity-0 overflow-hidden'}`}>

                                    {/* Link to Full Invoice View */}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); navigate(`/invoice/${invoice.id}`); }}
                                        className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 mb-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                            <FileText size={16} className="text-blue-500" />
                                            View Full Invoice
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>Open Details</span>
                                            <Share2 size={16} />
                                        </div>
                                    </button>

                                    {/* Payment Form */}
                                    <form onSubmit={(e) => handlePaymentSubmit(e, invoice.id, balance)}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Amount to Collect</label>
                                                <div className="relative">
                                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input
                                                        type="number"
                                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                                        value={paymentData[invoice.id]?.amount || ''}
                                                        onChange={(e) => handleInputChange(invoice.id, 'amount', e.target.value)}
                                                        max={balance}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Payment Mode</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['Cash', 'UPI', 'Cheque'].map(mode => (
                                                        <button
                                                            key={mode}
                                                            type="button"
                                                            onClick={() => handleInputChange(invoice.id, 'paymentMode', mode)}
                                                            className={`py-2.5 rounded-xl text-sm font-bold border transition-all flex flex-col items-center gap-1 ${paymentData[invoice.id]?.paymentMode === mode
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                                        >
                                                            {mode === 'Cash' && <Banknote size={18} />}
                                                            {mode === 'UPI' && <Search size={18} />} {/* Placeholder for QR/UPI icon */}
                                                            {mode === 'Cheque' && <CreditCard size={18} />}
                                                            {mode}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {paymentData[invoice.id]?.paymentMode !== 'Cash' && (
                                                <div className="animate-fade-in-up">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Transaction ID / Ref No</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                                                        placeholder={`Enter ${paymentData[invoice.id]?.paymentMode} Reference ID`}
                                                        value={paymentData[invoice.id]?.transactionId || ''}
                                                        onChange={(e) => handleInputChange(invoice.id, 'transactionId', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={processingId === invoice.id}
                                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                                            >
                                                {processingId === invoice.id ? (
                                                    <Loader className="animate-spin" size={20} />
                                                ) : (
                                                    <>
                                                        <CheckCircle size={20} /> Confirm Payment
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="p-6 bg-slate-100 rounded-full mb-4">
                            <CheckCircle size={48} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-lg text-slate-600">No pending collections</p>
                        <p className="text-sm">Great job! All payments collected.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollectPayment;
