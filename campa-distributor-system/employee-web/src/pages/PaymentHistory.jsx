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
                setPayments(Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []));
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
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 pb-32">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 pt-10 pb-10 rounded-b-[3rem] shadow-2xl transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:bg-white/10 transition-all border border-white/5"
                        >
                            <ArrowLeft size={20} strokeWidth={3} />
                        </button>
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Financial Archive</p>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Payment Ledger</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-10 max-w-2xl mx-auto space-y-6">
                {(() => {
                    const paymentsList = Array.isArray(payments) ? payments : [];
                    if (paymentsList.length > 0) {
                        return paymentsList.map((payment, index) => {
                            const Icon = getPaymentIcon(payment.paymentMode);
                            const retailerName = payment.invoice?.order?.retailer?.shopName || 'External Settlement';

                            return (
                                <div
                                    key={payment.id}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 hover:border-blue-500/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 group relative overflow-hidden shadow-2xl"
                                >
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="bg-black/40 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border border-white/5">
                                                    ID: #{payment.id}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                                    <Calendar size={12} className="text-blue-500" /> {new Date(payment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-white text-xl tracking-tighter italic uppercase mb-3 leading-tight group-hover:text-blue-400 transition-colors uppercase">{retailerName}</h3>
                                            <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                <div className={`p-2.5 rounded-xl bg-black/40 text-slate-500 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all border border-white/5`}>
                                                    <Icon size={18} strokeWidth={2.5} />
                                                </div>
                                                <span>Method: {payment.paymentMode}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-white text-3xl tracking-tighter italic">₹{parseFloat(payment.amount).toLocaleString()}</p>
                                            <div className="flex items-center justify-end gap-1.5 mt-2 text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                <ShieldCheck size={12} strokeWidth={3} />
                                                Verified
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex justify-between items-center group/footer">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Retailer</span>
                                                <span className="text-xs font-black text-white uppercase italic tracking-tighter">Inv #{payment.invoiceId}</span>
                                            </div>
                                            {payment.transactionId && (
                                                <div className="flex flex-col pl-6 border-l border-white/5">
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Signal ID</span>
                                                    <span className="text-xs font-black text-white tracking-[0.2em] uppercase">{payment.transactionId}</span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => navigate(`/invoice/${payment.invoiceId}`)}
                                            className="p-4 bg-white/5 rounded-2xl text-slate-500 group-hover/footer:bg-blue-500/10 group-hover/footer:text-blue-400 transition-all border border-transparent shadow-xl active:scale-95"
                                        >
                                            <ChevronRight size={20} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            );
                        });
                    }
                    return (
                        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-700">
                            <div className="w-28 h-28 bg-white/5 rounded-[3rem] shadow-2xl flex items-center justify-center mb-8 border border-white/5 transition-transform hover:-rotate-12">
                                <History size={56} className="text-slate-800" strokeWidth={1} />
                            </div>
                            <h3 className="font-black text-white text-2xl mb-3 tracking-tighter uppercase italic">No Log Entries</h3>
                            <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px] max-w-[280px] leading-relaxed">System awaiting financial data ingestion.</p>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default PaymentHistory;
