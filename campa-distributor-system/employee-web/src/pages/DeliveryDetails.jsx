import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { ArrowLeft, MapPin, Phone, User, CheckCircle, Navigation, IndianRupee, Truck, ShieldCheck, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const DeliveryDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [transactionId, setTransactionId] = useState('');
    const [collectingPayment, setCollectingPayment] = useState(false);

    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const response = await api.get(`/orders/${id}`);
            const orderData = response.data.data || response.data;
            setOrder(orderData);
            if (orderData.Invoice) {
                setPaymentAmount(orderData.invoice.balanceAmount);
            }
        } catch (error) {
            console.error("Failed to fetch order details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenMap = () => {
        if (order?.gpsLatitude && order?.gpsLongitude) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.gpsLatitude},${order.gpsLongitude}`, '_blank');
        } else {
            alert("No GPS location available for this order.");
        }
    };

    const handleCollectPayment = async (e) => {
        e.preventDefault();
        if (!order.Invoice) return alert("No invoice generated for this order.");

        setCollectingPayment(true);
        try {
            await api.post('/payments', {
                invoiceId: order.invoice.id,
                amount: paymentAmount,
                paymentMode,
                transactionId: paymentMode !== 'Cash' ? transactionId : ''
            });
            alert("Payment recorded successfully!");
            setTransactionId(''); // Reset
            fetchOrderDetails(); // Refresh to see updated balance
        } catch (error) {
            console.error("Payment failed", error);
            alert(error.response?.data?.message || "Payment failed");
        } finally {
            setCollectingPayment(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!window.confirm(`Are you sure you want to mark this order as ${status}?`)) return;

        try {
            await api.put(`/orders/${id}/status`, { status });
            alert(`Order marked as ${status}!`);
            navigate('/my-deliveries');
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!order) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-4 text-rose-500">
                <AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Order Not Found</h3>
            <p className="text-slate-500 mb-6 font-medium">The order details could not be retrieved.</p>
            <button onClick={() => navigate(-1)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold">Go Back</button>
        </div>
    );

    const isDelivered = order.status === 'Delivered';
    const isApproved = order.status === 'Approved';
    const isDispatched = order.status === 'Dispatched';
    const pendingAmount = order.invoice?.balanceAmount || order.totalAmount;

    const isAssignedToOther = order.driverId && order.driverId !== user.id;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-30 px-6 py-8 border-b border-slate-200 dark:border-white/5 rounded-b-[3rem] shadow-2xl transition-all">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:bg-white/10 transition-all border border-white/5">
                            <ArrowLeft size={20} strokeWidth={3} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Order Info</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">#{order.id}</span>
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Delivery Details</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
                {/* Protocol Conflict Alert */}
                {isAssignedToOther && (
                    <div className="bg-rose-500/10 p-5 rounded-[2rem] border border-rose-500/20 flex items-center gap-4 animate-pulse">
                        <div className="bg-rose-500/20 p-3 rounded-xl text-rose-500">
                            <AlertCircle size={20} />
                        </div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-relaxed">This order is assigned to another driver.</p>
                    </div>
                )}

                {/* Target Node (Retailer) */}
                <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 relative overflow-hidden shadow-2xl group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-blue-500/10 transition-all duration-700"></div>

                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex-1">
                            <h2 className="text-3xl font-black text-white tracking-tighter mb-2 italic leading-tight uppercase">{order.retailer?.shopName}</h2>
                            <div className="flex items-center gap-2 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                <User size={14} className="text-blue-500" />
                                <span>{order.retailer?.ownerName || 'Unknown Entity'}</span>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-2xl transition-all ${isDelivered ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                            {isApproved ? 'PENDING' : (isDelivered ? 'DELIVERED' : order.status)}
                        </span>
                    </div>

                    <div className="flex items-start gap-4 bg-black/40 p-5 rounded-[2rem] mb-8 border border-white/5 group-hover:border-blue-500/20 transition-all">
                        <MapPin size={22} className="text-slate-600 mt-1" />
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight leading-relaxed">{order.retailer?.address}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <button
                            onClick={handleOpenMap}
                            className="col-span-3 bg-white text-slate-950 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-white/5 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] border border-white"
                        >
                            <Navigation size={20} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
                            Get Directions
                        </button>
                        <a
                            href={`tel:${order.retailer?.phone}`}
                            className="bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-[1.5rem] flex items-center justify-center hover:bg-blue-500/20 active:scale-95 transition-all"
                        >
                            <Phone size={24} strokeWidth={2.5} />
                        </a>
                    </div>
                </div>

                {/* Command Deck (Actions) */}
                {!isAssignedToOther && (
                    <div className="space-y-6">
                        {/* Pickup Protocol */}
                        {isApproved && (
                            <button
                                onClick={() => handleUpdateStatus('Dispatched')}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-amber-900/20 active:scale-95 transition-all flex items-center justify-center gap-4 border border-amber-400/30"
                            >
                                <Truck size={28} strokeWidth={3} />
                                <span className="uppercase tracking-[0.2em]">Pick Up Order</span>
                            </button>
                        )}

                        {/* Termination Protocol (Complete Delivery) */}
                        {!isDelivered && (
                            <button
                                onClick={() => handleUpdateStatus('Delivered')}
                                className="w-full bg-white text-slate-950 font-black py-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(255,255,255,0.05)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group border-2 border-white"
                            >
                                <CheckCircle size={28} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
                                <span className="uppercase tracking-[0.2em] italic text-lg">Mark as Delivered</span>
                            </button>
                        )}

                        {/* Revenue Recovery (Payment Collection) */}
                        {isDelivered && (
                            <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                                <h3 className="font-black text-white uppercase italic tracking-tighter text-xl mb-8 flex items-center gap-3">
                                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                                        <IndianRupee size={22} strokeWidth={3} />
                                    </div>
                                    Collect Payment
                                </h3>

                                <div className="bg-emerald-500/5 p-6 rounded-[2rem] mb-10 flex justify-between items-center border border-emerald-500/10 relative overflow-hidden group/bill">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover/bill:bg-emerald-500/10 transition-all"></div>
                                    <span className="text-emerald-500/60 font-black text-[10px] uppercase tracking-[0.3em] relative z-10">Balance Due</span>
                                    <span className="text-3xl font-black text-white tracking-tighter italic relative z-10">₹{parseFloat(pendingAmount).toLocaleString()}</span>
                                </div>

                                {Number(pendingAmount) > 0 ? (
                                    <form onSubmit={handleCollectPayment} className="space-y-8 relative z-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2 block">Payment Mode</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['Cash', 'UPI', 'Cheque'].map(mode => (
                                                    <button
                                                        key={mode}
                                                        type="button"
                                                        onClick={() => setPaymentMode(mode)}
                                                        className={`py-4 rounded-2xl text-[10px] font-black border uppercase tracking-[0.2em] transition-all ${paymentMode === mode
                                                            ? 'bg-white text-slate-950 border-white shadow-2xl shadow-white/5'
                                                            : 'bg-black/40 text-slate-500 border-white/5 hover:border-white/20'}`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2 block">Amount to Collect (₹)</label>
                                            <div className="relative group/input">
                                                <input
                                                    type="number"
                                                    className="w-full px-6 py-5 bg-black/40 border border-white/5 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 font-black text-2xl text-white italic tracking-tighter transition-all"
                                                    value={paymentAmount}
                                                    max={pendingAmount}
                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {paymentMode !== 'Cash' && (
                                            <div className="animate-in slide-in-from-top-4 duration-300 space-y-3">
                                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-2 block">Reference Number</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-6 py-5 bg-black/40 border border-white/5 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 font-black text-white placeholder:text-slate-800 transition-all tracking-widest uppercase"
                                                    placeholder={`ENTER ${paymentMode} REF`}
                                                    value={transactionId}
                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={collectingPayment}
                                            className="w-full bg-emerald-500 text-slate-950 font-black py-5 rounded-[1.5rem] shadow-2xl shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-50 uppercase tracking-[0.2em] text-xs border border-emerald-400"
                                        >
                                            {collectingPayment ? <div className="w-6 h-6 border-[3px] border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div> : (
                                                <>
                                                    <ShieldCheck size={22} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                                    Save Payment
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="bg-emerald-500/10 p-6 rounded-[2rem] flex items-center gap-5 border border-emerald-500/20 shadow-2xl">
                                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl shadow-inner">
                                            <CheckCircle size={24} strokeWidth={3} />
                                        </div>
                                        <div>
                                            <p className="text-emerald-400 font-black uppercase italic tracking-tighter text-lg">Fully Paid</p>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">No outstanding balance.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Logistics Manifest Summary */}
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                    <h3 className="font-black text-white uppercase italic tracking-tighter text-xl mb-6 flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                            <Calendar size={20} strokeWidth={3} />
                        </div>
                        Order Summary
                    </h3>
                    <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-center group/meta">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] group-hover:text-slate-400 transition-colors">Payment Method</span>
                            <span className="text-xs font-black text-white uppercase tracking-widest italic">{order.paymentMode || 'CREDIT'}</span>
                        </div>
                        <div className="flex justify-between items-center group/meta pt-6 border-t border-white/5">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] group-hover:text-slate-400 transition-colors">Order Date</span>
                            <span className="text-xs font-black text-white uppercase tracking-widest italic">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryDetails;
