import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
    Truck,
    CheckCircle,
    Clock,
    MapPin,
    User,
    Package,
    Search
} from 'lucide-react';

const Deliveries = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDeliveries = async () => {
            try {
                // We fetch orders that are either Dispatched or Delivered
                const response = await api.get('/orders');
                const activeDeliveries = response.data.filter(
                    o => o.status === 'Dispatched' || o.status === 'Delivered'
                );
                setDeliveries(activeDeliveries);
            } catch (error) {
                console.error("Failed to fetch deliveries", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeliveries();
    }, []);

    const filteredDeliveries = deliveries.filter(d =>
        d.retailer?.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.id.toString().includes(searchTerm)
    );

    const activeCount = deliveries.filter(d => d.status === 'Dispatched').length;
    const completedCount = deliveries.filter(d => d.status === 'Delivered').length;

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[400px]">
            <div className="w-10 h-10 rounded-full animate-spin border-4 border-solid border-blue-500 border-t-transparent shadow-lg"></div>
        </div>
    );

    return (
        <div className="animate-fade-in-up space-y-8 p-2">
            <header>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Delivery Tracking</h1>
                <p className="text-slate-500 mt-1">Monitor active dispatches and driver performance</p>
            </header>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-blue-100 font-medium uppercase tracking-wider text-xs mb-1">In Transit</p>
                        <h2 className="text-4xl font-extrabold">{activeCount}</h2>
                        <p className="text-sm text-blue-100 mt-2">Orders currently with drivers</p>
                    </div>
                    <Truck className="absolute -right-4 -bottom-4 text-blue-400/30" size={100} />
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-emerald-100 font-medium uppercase tracking-wider text-xs mb-1">Delivered Today</p>
                        <h2 className="text-4xl font-extrabold">{completedCount}</h2>
                        <p className="text-sm text-emerald-100 mt-2">Succesfully completed deliveries</p>
                    </div>
                    <CheckCircle className="absolute -right-4 -bottom-4 text-emerald-400/30" size={100} />
                </div>
            </div>

            {/* Delivery List */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Recent Deliveries</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search Delivery..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100 "
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredDeliveries.map(delivery => (
                        <div key={delivery.id} className="group flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-all hover:bg-white hover:shadow-md">
                            <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${delivery.status === 'Dispatched' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {delivery.status === 'Dispatched' ? <Truck size={24} /> : <CheckCircle size={24} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">#{delivery.id} - {delivery.retailer?.shopName}</h4>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <Clock size={14} />
                                        {new Date(delivery.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Driver</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 font-bold">
                                            <User size={12} />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">
                                            {/* Driver name is mocked here as we assume include user, fix backend if null */}
                                            Driver #{delivery.driverId}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${delivery.status === 'Dispatched'
                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${delivery.status === 'Dispatched' ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                        {delivery.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredDeliveries.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            No deliveries found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Deliveries;
