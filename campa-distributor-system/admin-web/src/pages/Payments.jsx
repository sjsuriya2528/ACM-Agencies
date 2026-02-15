import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    CreditCard,
    Search,
    Filter,
    Calendar,
    User,
    Store,
    IndianRupee,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState('All'); // 'All', 'Cash', 'Credit', 'UPI'

    useEffect(() => {
        fetchPayments();
    }, []);

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

    const filteredPayments = payments.filter(payment => {
        const matchesSearch =
            (payment.Invoice?.Order?.retailer?.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.collectedBy?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesMode = filterMode === 'All' || payment.paymentMode === filterMode;

        return matchesSearch && matchesMode;
    });

    const getTotalCollected = () => {
        return filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[400px]">
            <div className="w-10 h-10 rounded-full animate-spin border-4 border-solid border-blue-500 border-t-transparent shadow-lg"></div>
        </div>
    );

    return (
        <div className="animate-fade-in-up space-y-8 p-2">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Payments</h1>
                    <p className="text-slate-500 mt-1">Track payment history and collections</p>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-lg shadow-emerald-200 min-w-[200px]">
                    <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Collected</p>
                    <div className="flex items-center gap-2">
                        <IndianRupee size={24} />
                        <span className="text-2xl font-bold">{getTotalCollected().toLocaleString()}</span>
                    </div>
                </div>
            </header>

            {/* Filters & Search */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search Retailer, Collector, or ID..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-xl flex">
                        {['All', 'Cash', 'Credit', 'UPI'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setFilterMode(mode)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterMode === mode
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-left">
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Retailer</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Mode</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Collected By</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Invoice ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredPayments.length > 0 ? (
                            filteredPayments.map(payment => (
                                <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <Calendar size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                <Store size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">
                                                    {payment.Invoice?.Order?.retailer?.shopName || 'Unknown Shop'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="text-emerald-600 font-bold">
                                            +₹{Number(payment.amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${payment.paymentMode === 'Cash' ? 'bg-green-100 text-green-700' :
                                            payment.paymentMode === 'UPI' ? 'bg-purple-100 text-purple-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {payment.paymentMode}
                                        </span>
                                        {payment.transactionId && (
                                            <p className="text-xs text-slate-400 mt-1 font-mono">{payment.transactionId}</p>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-400" />
                                            <span className="text-sm text-slate-600">{payment.collectedBy?.name || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">
                                            #{payment.invoiceId}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="p-12 text-center text-slate-400">
                                    No payments found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Payments;
