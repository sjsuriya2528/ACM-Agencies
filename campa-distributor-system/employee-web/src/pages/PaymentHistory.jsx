import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, Clock, Calendar, FileText, CheckCircle } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-24">
            {/* Header */}
            <div className="sticky top-0 bg-slate-50 z-10 pb-4">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-extrabold text-slate-800">Payment History</h1>
                    <div className="w-10"></div>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : payments.length > 0 ? (
                    payments.map((payment, index) => (
                        <div
                            key={payment.id}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-fade-in-up hover:shadow-md transition-shadow relative overflow-hidden"
                        >
                            {/* Gradient Accent */}
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-green-500 to-emerald-600"></div>

                            <div className="flex justify-between items-start mb-4 pl-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-green-50 text-green-600 rounded-full">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base">Payment Received</h3>
                                        <p className="text-xs text-slate-500 font-medium">Txn #{payment.id}</p>
                                    </div>
                                </div>
                                <span className="font-extrabold text-green-600 text-lg">+₹{payment.amount}</span>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dashed pl-3">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                                    <FileText size={14} />
                                    <span>Inv #{payment.invoiceId}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                    <Calendar size={14} />
                                    <span>{new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="p-6 bg-slate-100 rounded-full mb-4">
                            <Clock size={48} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-lg text-slate-600">No payment history</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentHistory;
