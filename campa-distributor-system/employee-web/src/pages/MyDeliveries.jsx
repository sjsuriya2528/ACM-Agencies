import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { ArrowLeft, Search, Navigation, Package, CheckCircle, Truck, MapPin, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const MyDeliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                const response = await api.get('/orders');
                setDeliveries(response.data);
            } catch (error) {
                console.error("Failed to fetch deliveries", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDeliveries();
    }, [user]);

    const filteredDeliveries = deliveries.filter(d =>
        (d.retailer?.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.id.toString().includes(searchTerm)) &&
        ['Approved', 'Dispatched', 'Delivered'].includes(d.status)
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: Package, label: 'Pending Pickup', gradient: 'from-amber-400 to-orange-500' };
            case 'Dispatched': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: Truck, label: 'On Route', gradient: 'from-blue-400 to-indigo-500' };
            case 'Delivered': return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Delivered', gradient: 'from-emerald-400 to-teal-500' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', icon: Package, label: status, gradient: 'from-slate-400 to-gray-500' };
        }
    };

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
                    <h1 className="text-xl font-extrabold text-slate-800">My Deliveries</h1>
                    <div className="w-10"></div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search Shop or Order ID..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 transition-all focus:shadow-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredDeliveries.length > 0 ? (
                    filteredDeliveries.map((delivery, index) => {
                        const isMyDelivery = delivery.driverId === user.id;
                        const statusStyle = getStatusStyle(delivery.status);
                        const StatusIcon = statusStyle.icon;

                        return (
                            <div
                                key={delivery.id}
                                onClick={() => navigate(`/delivery/${delivery.id}`)}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md transition-all duration-200 active:scale-[0.98] animate-fade-in-up cursor-pointer group relative overflow-hidden ${isMyDelivery || delivery.status === 'Approved' ? 'border-slate-100' : 'border-slate-100 opacity-80'}`}
                            >
                                {/* Gradient Accent */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${statusStyle.gradient}`}></div>

                                <div className="flex justify-between items-start mb-3 pl-3">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{delivery.retailer?.shopName}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{delivery.id}</span>
                                        </div>
                                    </div>
                                    <span className={`flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                        <StatusIcon size={14} className="mr-1" />
                                        {statusStyle.label}
                                    </span>
                                </div>

                                <div className="flex items-start gap-2 mb-4 pl-3">
                                    <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-slate-600 font-medium leading-snug">{delivery.retailer?.address || 'No address provided'}</p>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-slate-50 dashed pl-3">
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <DollarSign size={16} className="text-slate-400" />
                                        <span className="font-bold text-slate-800 text-lg">₹{delivery.Invoice?.balanceAmount || delivery.totalAmount}</span>
                                    </div>

                                    {delivery.status === 'Approved' ? (
                                        <div className="flex items-center gap-1 text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-md shadow-slate-200 group-hover:bg-slate-800 transition-colors">
                                            Assign to Me <Navigation size={12} />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-full group-hover:bg-blue-100 transition-colors">
                                            <Navigation size={18} />
                                        </div>
                                    )}
                                </div>
                                {delivery.status !== 'Approved' && !isMyDelivery && (
                                    <div className="mt-2 pl-3">
                                        <span className="text-xs bg-slate-50 text-slate-400 py-1 px-2 rounded-md inline-block font-medium">
                                            Assigned to another driver
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="p-6 bg-slate-100 rounded-full mb-4">
                            <Package size={48} className="text-slate-300" />
                        </div>
                        <p className="font-medium text-lg text-slate-600">No deliveries found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyDeliveries;
