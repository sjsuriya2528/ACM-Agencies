import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentHistory = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                // Assuming an endpoint exists to get payments collected by user or all payments
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
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Payment History</h1>
                <div className="w-8"></div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {payments.map((payment) => (
                        <div key={payment.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-800">Payment #{payment.id}</h3>
                                    <p className="text-sm text-gray-500">Invoice #{payment.invoiceId}</p>
                                </div>
                                <span className="font-bold text-green-600">₹{payment.amount}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-xs mt-2">
                                <Clock size={12} />
                                <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {payments.length === 0 && <p className="text-center text-gray-500">No payment history found.</p>}
                </div>
            )}
        </div>
    );
};

export default PaymentHistory;
