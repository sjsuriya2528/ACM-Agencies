import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { ArrowLeft, Search, Navigation, Package, CheckCircle, Truck, MapPin, DollarSign, ChevronRight, Clock } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
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
                setDeliveries(response.data.data || []);
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
            case 'Approved': return {
                bg: 'bg-amber-50',
                text: 'text-amber-700',
                border: 'border-amber-100',
                icon: Clock,
                label: 'Pending Pickup',
                gradient: 'from-amber-400 to-orange-500'
            };
            case 'Dispatched': return {
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                border: 'border-blue-100',
                icon: Truck,
                label: 'On Route',
                gradient: 'from-blue-400 to-indigo-500'
            };
            case 'Delivered': return {
                bg: 'bg-emerald-50',
                text: 'text-emerald-700',
                border: 'border-emerald-100',
                icon: CheckCircle,
                label: 'Delivered',
                gradient: 'from-emerald-400 to-teal-500'
            };
            default: return {
                bg: 'bg-slate-50',
                text: 'text-slate-700',
                border: 'border-slate-200',
                icon: Package,
                label: status,
                gradient: 'from-slate-400 to-gray-500'
            };
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-100 px-5 pt-6 pb-6 rounded-b-[2.5rem]">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-slate-50 rounded-2xl text-slate-600 hover:bg-white hover:shadow-md transition-all border border-slate-100"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Daily Routes</h1>
                        <div className="w-11"></div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Find shop or order ID..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-500/5 focus:outline-none font-bold text-slate-700 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="px-5 py-8 max-w-7xl mx-auto space-y-5">
                {filteredDeliveries.length > 0 ? (
                    filteredDeliveries.map((delivery, index) => {
                        const isMyDelivery = delivery.driverId === user.id;
                        const statusStyle = getStatusStyle(delivery.status);
                        const StatusIcon = statusStyle.icon;

                        return (
                            <div
                                key={delivery.id}
                                onClick={() => navigate(`/delivery/${delivery.id}`)}
                                style={{ animationDelay: `${index * 50}ms` }}
                                className={`bg-white p-6 rounded-[2rem] shadow-lg border transition-all duration-300 active:scale-[0.98] animate-fade-in-up cursor-pointer group relative overflow-hidden ${isMyDelivery || delivery.status === 'Approved' ? 'border-slate-100' : 'border-slate-100 opacity-80'}`}
                            >
                                {/* Status Gradient Bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${statusStyle.gradient}`}></div>

                                <div className="flex justify-between items-start mb-4 pl-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">#{delivery.id}</span>
                                            {isMyDelivery && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Assigned to You</span>
                                            )}
                                        </div>
                                        <h3 className="font-extrabold text-slate-800 text-xl leading-snug group-hover:text-blue-700 transition-colors">{delivery.retailer?.shopName}</h3>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} shadow-sm uppercase tracking-wider`}>
                                        <StatusIcon size={14} />
                                        {statusStyle.label}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 mb-6 pl-3">
                                    <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                        <MapPin size={18} />
                                    </div>
                                    <p className="text-sm text-slate-500 font-bold leading-relaxed">{delivery.retailer?.address || 'No address provided'}</p>
                                </div>

                                <div className="flex justify-between items-center pt-5 border-t border-slate-50 border-dashed pl-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <DollarSign size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing</p>
                                            <p className="font-black text-slate-800 text-lg">₹{(delivery.Invoice?.balanceAmount || delivery.totalAmount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {delivery.status === 'Approved' ? (
                                            <button className="flex items-center gap-2 text-xs font-black bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl shadow-slate-200 group-hover:scale-105 active:scale-95 transition-all">
                                                Self Assign <ChevronRight size={16} />
                                            </button>
                                        ) : (
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                                <Navigation size={22} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {delivery.status !== 'Approved' && !isMyDelivery && (
                                    <div className="mt-4 pl-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        <span className="text-xs text-slate-400 font-bold italic">
                                            In custody of another partner
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-6 border border-slate-50 transition-transform hover:rotate-12">
                            <Package size={48} className="text-slate-200" />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-2 tracking-tight">No Active Routes</h3>
                        <p className="text-slate-400 font-medium max-w-[240px] leading-relaxed italic">Currently there are no assignments available for dispatch.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyDeliveries;
