import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ArrowLeft, IndianRupee, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CollectPayment = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Since there might not be a direct 'pending payments' endpoint, we might need to fetch pending invoices
    // Checking invoiceRoutes.js would be ideal, but assuming standard REST for now
    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                // Fetching all invoices and filtering for pending/partial on client if needed
                // Or assuming a query param exists
                const response = await api.get('/invoices?status=Pending');
                setInvoices(response.data);
            } catch (error) {
                console.error("Failed to fetch invoices", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const handlePayment = async (invoiceId, amountDue) => {
        const amount = prompt(`Enter amount to collect (Due: ${amountDue})`);
        if (!amount) return;

        try {
            await api.post('/payments', {
                invoiceId,
                amount: parseFloat(amount),
                paymentMethod: 'Cash', // Defaulting for now
                // agentId taken from token/session usually
            });
            alert("Payment recorded successfully");
            // Refresh list
            const response = await api.get('/invoices?status=Pending');
            setInvoices(response.data);
        } catch (error) {
            console.error("Payment failed", error);
            alert("Failed to record payment");
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.Order?.Retailer?.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.id.toString().includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Collect Payment</h1>
                <div className="w-8"></div>
            </div>

            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Search Retailer or Invoice ID..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {filteredInvoices.map((invoice) => (
                        <div key={invoice.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800">Invoice #{invoice.id}</h3>
                                <p className="text-sm text-gray-500">{invoice.Order?.Retailer?.shopName}</p>
                                <p className="text-xs text-gray-400">Total: ₹{invoice.totalAmount}</p>
                            </div>
                            <button
                                onClick={() => handlePayment(invoice.id, invoice.totalAmount)} // Simplified due amount logic
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
                            >
                                <IndianRupee size={16} /> Collect
                            </button>
                        </div>
                    ))}
                    {filteredInvoices.length === 0 && <p className="text-center text-gray-500">No pending invoices found.</p>}
                </div>
            )}
        </div>
    );
};

export default CollectPayment;
