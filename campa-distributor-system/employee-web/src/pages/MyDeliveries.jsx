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
                setDeliveries(Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []));
            } catch (error) {
                console.error("Failed to fetch deliveries", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDeliveries();
    }, [user]);

    if (!Array.isArray(deliveries)) {
        console.warn("Filter warning: 'deliveries' is not an array in MyDeliveries. Type:", typeof deliveries, "Value:", deliveries);
    }
    const filteredDeliveries = (Array.isArray(deliveries) ? deliveries : []).filter(d =>
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
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 pb-32">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 pt-8 pb-8 rounded-b-[3rem] shadow-2xl transition-all">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:bg-white/10 transition-all border border-white/5"
                        >
                            <ArrowLeft size={20} strokeWidth={3} />
                        </button>
                        <div className="text-center">
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Daily Routes</h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Order List</p>
                        </div>
                        <div className="w-11"></div>
                    </div>

                    {/* Search Module */}
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search shop name or ID..."
                            className="w-full pl-14 pr-6 py-5 bg-black/40 rounded-[1.5rem] border border-white/5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 font-black text-white placeholder:text-slate-800 transition-all shadow-2xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* List Manifest */}
            <div className="px-6 py-10 max-w-2xl mx-auto space-y-6">
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
                                className={`bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 transition-all duration-500 active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 cursor-pointer group relative overflow-hidden shadow-2xl hover:border-blue-500/30 ${isMyDelivery || delivery.status === 'Approved' ? '' : 'opacity-60'}`}
                            >
                                {/* Vector Gradient Accent */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${statusStyle.gradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>

                                <div className="flex justify-between items-start mb-6 pl-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">#{delivery.id}</span>
                                            {isMyDelivery && (
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">Assigned to You</span>
                                            )}
                                        </div>
                                        <h3 className="font-black text-white text-2xl tracking-tighter leading-tight italic uppercase group-hover:text-blue-400 transition-colors uppercase">{delivery.retailer?.shopName}</h3>
                                    </div>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black border transition-all ${statusStyle.bg.replace('bg-', 'bg-').replace('50', '500/10')} ${statusStyle.text.replace('text-', 'text-').replace('700', '400')} ${statusStyle.border.replace('border-', 'border-').replace('100', '500/20')} shadow-2xl uppercase tracking-[0.2em]`}>
                                        <StatusIcon size={14} strokeWidth={3} />
                                        {statusStyle.label === 'Pending Pickup' ? 'PENDING' : (statusStyle.label === 'On Route' ? 'ON ROUTE' : statusStyle.label.toUpperCase())}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 mb-8 pl-4">
                                    <div className="p-3 bg-black/40 rounded-xl text-slate-600 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all border border-white/5">
                                        <MapPin size={20} strokeWidth={2.5} />
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tight leading-relaxed">{delivery.retailer?.address || 'Physical coords unavailable'}</p>
                                </div>

                                <div className="flex justify-between items-center pt-6 border-t border-white/5 pl-4 bg-black/20 -mx-8 px-8 -mb-8 pb-8 rounded-b-[2.5rem]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-inner">
                                            <DollarSign size={20} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Amount</p>
                                            <p className="font-black text-white text-xl italic tracking-tighter">₹{(delivery.invoice?.balanceAmount || delivery.totalAmount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {delivery.status === 'Approved' ? (
                                            <button className="flex items-center gap-2 text-[10px] font-black bg-white text-slate-950 px-6 py-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] border border-white">
                                                Self Assign <ChevronRight size={16} strokeWidth={3} />
                                            </button>
                                        ) : (
                                            <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl group-hover:bg-blue-500 group-hover:text-slate-950 transition-all border border-blue-500/20">
                                                <Navigation size={24} strokeWidth={2.5} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {delivery.status !== 'Approved' && !isMyDelivery && (
                                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                        <span className="text-[8px] text-rose-400 font-black uppercase tracking-widest">
                                            Assigned to another driver
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-700">
                        <div className="w-28 h-28 bg-white/5 rounded-[3rem] shadow-2xl flex items-center justify-center mb-8 border border-white/5 transition-transform hover:rotate-12">
                            <Package size={56} className="text-slate-800" strokeWidth={1} />
                        </div>
                        <h3 className="font-black text-white text-2xl mb-3 tracking-tighter uppercase italic">No active deliveries</h3>
                        <p className="text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px] max-w-[280px] leading-relaxed">Check back later for new deliveries.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyDeliveries;
