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
                setPaymentAmount(orderData.Invoice.balanceAmount);
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
                invoiceId: order.Invoice.id,
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
    const pendingAmount = order.Invoice?.balanceAmount || order.totalAmount;

    const isAssignedToOther = order.driverId && order.driverId !== user.id;

    return (
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm z-30 px-5 pt-8 pb-6 border-b border-slate-100 rounded-b-[2.5rem]">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 rounded-2xl text-slate-600 hover:bg-white hover:shadow-md transition-all border border-slate-100">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">#{order.id}</span>
                            </div>
                            <h1 className="text-lg font-black text-slate-800 tracking-tight">Delivery Details</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 py-8 max-w-7xl mx-auto space-y-6">
                {/* Status Alert */}
                {isAssignedToOther && (
                    <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100 flex items-center gap-4 animate-pulse">
                        <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                            <AlertCircle size={20} />
                        </div>
                        <p className="text-sm font-bold text-rose-800">This order is assigned to another delivery partner.</p>
                    </div>
                )}

                {/* Retailer Card */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-[0.03] rounded-bl-full -mr-10 -mt-10"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2 leading-tight">{order.retailer?.shopName}</h2>
                            <div className="flex items-center gap-2 text-slate-500 font-bold">
                                <User size={16} className="text-blue-500" />
                                <span className="text-sm">{order.retailer?.ownerName}</span>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ${isDelivered ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-blue-50 text-blue-700 ring-blue-100'}`}>
                            {isApproved ? 'Awaiting Dispatch' : order.status}
                        </span>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-3xl mb-8 border border-slate-100">
                        <MapPin size={20} className="text-slate-400 mt-0.5" />
                        <p className="text-sm text-slate-600 font-bold leading-relaxed">{order.retailer?.address}</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleOpenMap}
                            className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-95 transition-all text-sm group"
                        >
                            <Navigation size={18} className="group-hover:translate-x-0.5 transition-transform" />
                            Directions
                        </button>
                        <a
                            href={`tel:${order.retailer?.phone}`}
                            className="bg-blue-50 text-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-blue-100 active:scale-95 transition-all"
                        >
                            <Phone size={24} />
                        </a>
                    </div>
                </div>

                {/* Main Actions */}
                {!isAssignedToOther && (
                    <div className="space-y-6">
                        {/* Pickup Action */}
                        {isApproved && (
                            <button
                                onClick={() => handleUpdateStatus('Dispatched')}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Truck size={24} />
                                Confirm Item Pickup
                            </button>
                        )}

                        {/* Completion Action */}
                        {!isDelivered && (
                            <button
                                onClick={() => handleUpdateStatus('Delivered')}
                                className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                            >
                                <CheckCircle size={24} className="group-hover:rotate-12 transition-transform" />
                                Complete Delivery
                            </button>
                        )}

                        {/* Payment Collection - ONLY SHOW WHEN DELIVERED */}
                        {isDelivered && (
                            <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100">
                                <h3 className="font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                                        <IndianRupee size={20} />
                                    </div>
                                    Collection
                                </h3>

                                <div className="bg-emerald-50/50 p-5 rounded-3xl mb-8 flex justify-between items-center border border-emerald-100">
                                    <span className="text-emerald-700 font-black text-sm uppercase tracking-widest">Pending Bill</span>
                                    <span className="text-2xl font-black text-emerald-800 tracking-tight">₹{parseFloat(pendingAmount).toLocaleString()}</span>
                                </div>

                                {Number(pendingAmount) > 0 ? (
                                    <form onSubmit={handleCollectPayment} className="space-y-5">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Payment Mode</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['Cash', 'UPI', 'Cheque'].map(mode => (
                                                    <button
                                                        key={mode}
                                                        type="button"
                                                        onClick={() => setPaymentMode(mode)}
                                                        className={`py-3 rounded-2xl text-xs font-black border transition-all ${paymentMode === mode
                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100'
                                                            : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Received Amount</label>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-500/5 font-black text-slate-800 transition-all"
                                                    value={paymentAmount}
                                                    max={pendingAmount}
                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {paymentMode !== 'Cash' && (
                                            <div className="animate-fade-in-up mt-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Reference / Trans ID</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-emerald-100 focus:ring-4 focus:ring-emerald-500/5 font-bold text-slate-800 transition-all"
                                                    placeholder={`Enter ${paymentMode} Ref #`}
                                                    value={transactionId}
                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={collectingPayment}
                                            className="w-full bg-emerald-600 text-white font-black py-4 rounded-[1.5rem] shadow-xl shadow-emerald-100/50 active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                        >
                                            {collectingPayment ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                                                <>
                                                    <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />
                                                    Submit Payment
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="bg-emerald-50 p-5 rounded-3xl flex items-center gap-4 border border-emerald-100">
                                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                            <CheckCircle size={20} />
                                        </div>
                                        <p className="text-emerald-800 font-bold text-sm tracking-tight">Payment has been cleared for this order.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Order Overview Items */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 mt-6">
                    <h3 className="font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                            <ShieldCheck size={20} />
                        </div>
                        Summary
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-bold text-slate-500">Order Method</span>
                            <span className="text-sm font-black text-slate-800">{order.paymentMode || 'Credit'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-t border-slate-50 border-dashed">
                            <span className="text-sm font-bold text-slate-500">Scheduled Date</span>
                            <span className="text-sm font-black text-slate-800">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryDetails;
