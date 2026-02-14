import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ArrowLeft, Search, Navigation, Package, CheckCircle, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const MyDeliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        try {
            console.log("Fetching deliveries for user:", user);
            const response = await api.get('/orders');
            console.log("Deliveries response:", response.data);
            setDeliveries(response.data);
        } catch (error) {
            console.error("Failed to fetch deliveries", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDeliveries = deliveries.filter(d =>
        (d.retailer?.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.id.toString().includes(searchTerm)) &&
        ['Approved', 'Dispatched', 'Delivered'].includes(d.status)
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-yellow-100 text-yellow-700'; // Pending Pick Up
            case 'Dispatched': return 'bg-blue-100 text-blue-700';
            case 'Delivered': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-lg font-bold">Deliveries</h1>
            </div>

            <div className="p-4 space-y-4">
                {/* Search */}
                <div className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search Shop or ID..."
                        className="flex-1 outline-none text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Delivery List */}
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading deliveries...</div>
                ) : filteredDeliveries.length > 0 ? (
                    filteredDeliveries.map(delivery => {
                        const isMyDelivery = delivery.driverId === user.id;
                        return (
                            <div
                                key={delivery.id}
                                onClick={() => navigate(`/delivery/${delivery.id}`)}
                                className={`bg-white p-4 rounded-xl shadow-sm active:scale-[0.99] transition-transform border-l-4 ${isMyDelivery || delivery.status === 'Approved' ? 'border-blue-500' : 'border-gray-300'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{delivery.retailer?.shopName}</h3>
                                        <p className="text-xs text-gray-500">Order #{delivery.id}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(delivery.status)}`}>
                                        {delivery.status === 'Approved' ? 'Pending' : delivery.status}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{delivery.retailer?.address}</p>

                                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                                    <span className="font-bold text-gray-800">
                                        Amount: ₹{delivery.Invoice?.balanceAmount || delivery.totalAmount}
                                    </span>
                                    {delivery.status === 'Approved' ? (
                                        <div className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1">
                                            <Truck size={14} /> Open
                                        </div>
                                    ) : (
                                        <div className="bg-gray-100 p-2 rounded-full text-blue-600">
                                            <Navigation size={16} />
                                        </div>
                                    )}
                                </div>
                                {delivery.status !== 'Approved' && !isMyDelivery && (
                                    <p className="text-xs text-gray-400 mt-2 italic">Assigned to another driver</p>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10">
                        <Package size={48} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500">No deliveries found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyDeliveries;
