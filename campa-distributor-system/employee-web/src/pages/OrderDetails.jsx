import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await api.get(`/orders/${id}`);
                setOrder(response.data.data || response.data);
            } catch (error) {
                console.error("Failed to fetch order details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading details...</div>;
    if (!order) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Order not found</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            case 'Requested': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle size={18} />;
            case 'Rejected': return <XCircle size={18} />;
            default: return <Clock size={18} />;
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 pb-20">
            {/* Header */}
            <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10 px-6 py-5 flex items-center gap-4 border-b border-slate-200 dark:border-white/5 transition-all">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all border border-white/5"
                >
                    <ArrowLeft size={20} strokeWidth={3} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Order #{order.id}</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Transaction Details</p>
                </div>
            </div>

            <div className="p-6 space-y-6 max-w-2xl mx-auto">
                {/* Status Command Module */}
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Order Status</p>
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${getStatusColor(order.status).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                {getStatusIcon(order.status)}
                                {order.status === 'Approved' ? 'Approved' : order.status}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Timestamp</p>
                            <p className="font-black text-white italic tracking-tight leading-tight">{new Date(order.createdAt).toLocaleDateString()}</p>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">{new Date(order.createdAt).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>

                {/* Destination Node (Retailer) */}
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl">
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none"></div>
                    
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <MapPin size={14} className="text-blue-500" />
                        Retailer
                    </h2>
                    <div className="space-y-4 relative z-10">
                        <div>
                            <p className="text-xl font-black text-white italic tracking-tighter leading-tight">{order.retailer?.shopName}</p>
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-1">{order.retailer?.ownerName}</p>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                                <MapPin size={16} className="text-slate-600 mt-1" />
                                <span className="text-slate-400 text-[11px] font-medium uppercase tracking-tight leading-relaxed">{order.retailer?.address}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                                <Clock size={16} className="text-slate-600" />
                                <span className="text-slate-300 font-black italic tracking-wider">{order.retailer?.phone}</span>
                            </div>
                        </div>

                        {order.gpsLatitude && (
                            <a
                                href={`https://www.google.com/maps?q=${order.gpsLatitude},${order.gpsLongitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-4 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl text-center hover:bg-blue-600/20 transition-all flex items-center justify-center gap-2 group"
                            >
                                <MapPin size={14} className="group-hover:translate-y-[-1px] transition-transform" />
                                View on Maps
                            </a>
                        )}
                    </div>
                </div>

                {/* Inventory Manifest (Items) */}
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl">
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Package size={14} className="text-blue-500" />
                        Order Items
                    </h2>
                    <div className="divide-y divide-white/5 relative z-10">
                        {order.items?.map((item, index) => {
                            const bottlesPerCrate = item.product?.bottlesPerCrate || 24;
                            const crates = Math.floor(item.quantity / bottlesPerCrate);
                            const pieces = item.quantity % bottlesPerCrate;

                            return (
                                <div key={index} className="py-4 flex justify-between items-center group/item">
                                    <div>
                                        <p className="font-black text-white italic tracking-tight group-hover:text-blue-400 transition-colors uppercase">{item.product?.name || 'Unknown Asset'}</p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                            {crates > 0 && <span className="text-blue-400/80">{crates} CRATES </span>}
                                            {pieces > 0 && <span className="text-indigo-400/80">{pieces} UNITS</span>}
                                            {crates === 0 && pieces === 0 && '0 UNITS'}
                                            <span className="text-slate-700 mx-2">|</span>
                                            ₹{item.pricePerUnit} per unit
                                        </p>
                                    </div>
                                    <p className="font-black text-white tracking-tighter text-lg italic">₹{item.totalPrice.toLocaleString()}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="border-t border-white/10 mt-6 pt-6 flex justify-between items-center bg-white/[0.02] -mx-6 px-6 -mb-6 pb-6 rounded-b-[2.5rem]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Total Amount</span>
                        <span className="text-2xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">₹{parseFloat(order.totalAmount).toLocaleString()}</span>
                    </div>
                </div>

                {/* Fiscal Module (Invoice) */}
                {order.Invoice && (
                    <div className="bg-white text-slate-950 p-8 rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(255,255,255,0.1)] relative overflow-hidden border border-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                                    <FileText size={24} strokeWidth={3} />
                                    Invoice Details
                                </h2>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic">INV-#{order.Invoice.invoiceNumber || order.Invoice.id}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all ${order.Invoice.paymentStatus === 'Paid' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'}`}>
                                {order.Invoice.paymentStatus}
                            </span>
                        </div>

                        <div className="flex items-center justify-between mb-8 bg-slate-100 p-6 rounded-[2rem] border border-slate-200">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Balance Amount</span>
                            <span className="text-3xl font-black tracking-tighter italic">₹{Number(order.Invoice.balanceAmount).toLocaleString()}</span>
                        </div>

                        <button
                            onClick={() => navigate(`/invoice/${order.Invoice.id}`)}
                            className="w-full py-5 bg-slate-950 text-white font-black rounded-[1.5rem] shadow-2xl transition-all active:scale-[0.98] hover:bg-slate-800 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] border-2 border-slate-950"
                        >
                            <FileText size={20} strokeWidth={3} /> View Invoice
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetails;
