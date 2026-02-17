import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, IndianRupee, Calendar, CreditCard, Banknote, ShieldCheck, ChevronRight, History, Wallet, User, Hash } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await api.get('/payments');
                setPayments(response.data);
            } catch (error) {
                console.error("Failed to fetch payments", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    const getPaymentIcon = (mode) => {
        switch (mode) {
            case 'Cash': return Banknote;
            case 'UPI': return Wallet;
            default: return CreditCard;
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-100 px-5 pt-8 pb-6 rounded-b-[2.5rem]">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-slate-50 rounded-2xl text-slate-600 hover:bg-white hover:shadow-md transition-all border border-slate-100"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Logs</p>
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">Payment History</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 py-8 max-w-7xl mx-auto space-y-5">
                {payments.length > 0 ? (
                    payments.map((payment, index) => {
                        const Icon = getPaymentIcon(payment.paymentMode);
                        const retailerName = payment.Invoice?.Order?.retailer?.shopName || 'Market Collection';

                        return (
                            <div
                                key={payment.id}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 animate-fade-in-up group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-slate-100">
                                                ID: #{payment.id}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(payment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight tracking-tight mb-2">{retailerName}</h3>
                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                            <div className={`p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors`}>
                                                <Icon size={18} />
                                            </div>
                                            <span>Paid via {payment.paymentMode}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-emerald-600 text-2xl tracking-tighter">₹{parseFloat(payment.amount).toLocaleString()}</p>
                                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                            <ShieldCheck size={12} />
                                            Verified
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 border-dashed flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Reference</span>
                                            <span className="text-sm font-black text-slate-600">Inv #{payment.invoiceId}</span>
                                        </div>
                                        {payment.transactionId && (
                                            <div className="flex flex-col pl-4 border-l border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref Number</span>
                                                <span className="text-sm font-black text-slate-600 tracking-wider uppercase">{payment.transactionId}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => navigate(`/invoice/${payment.invoiceId}`)}
                                        className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all border border-transparent group-hover:border-blue-100"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-6 border border-slate-50 transition-transform hover:-rotate-12">
                            <History size={48} className="text-slate-200" />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-2 tracking-tight">No Transactions Yet</h3>
                        <p className="text-slate-400 font-medium max-w-[240px] leading-relaxed italic">Once you start collecting payments, your transaction history will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentHistory;
