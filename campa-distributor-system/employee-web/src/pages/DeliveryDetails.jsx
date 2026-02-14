import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { ArrowLeft, MapPin, Phone, User, CheckCircle, Navigation, IndianRupee, Truck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DeliveryDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [collectingPayment, setCollectingPayment] = useState(false);

    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const response = await api.get(`/orders/${id}`);
            setOrder(response.data);
            if (response.data.Invoice) {
                setPaymentAmount(response.data.Invoice.balanceAmount);
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
            });
            alert("Payment recorded successfully!");
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

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!order) return <div className="p-10 text-center">Order not found</div>;

    const isDelivered = order.status === 'Delivered';
    const isApproved = order.status === 'Approved';
    const isDispatched = order.status === 'Dispatched';
    const pendingAmount = order.Invoice?.balanceAmount || order.totalAmount;

    // Check if assigned to another driver (if dispatched/delivered and not me)
    const isAssignedToOther = order.driverId && order.driverId !== user.id;

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-lg font-bold">Delivery Details #{order.id}</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Retailer Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{order.retailer?.shopName}</h2>
                            <div className="flex items-center gap-1 text-gray-500 mt-1">
                                <User size={14} />
                                <span className="text-sm">{order.retailer?.ownerName}</span>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDelivered ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {order.status === 'Approved' ? 'Pending' : order.status}
                        </span>
                    </div>

                    <div className="flex items-start gap-2 text-gray-600 mb-4">
                        <MapPin size={18} className="mt-1 shrink-0" />
                        <p className="text-sm">{order.retailer?.address}</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleOpenMap}
                            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-transform"
                        >
                            <Navigation size={18} />
                            Navigate
                        </button>
                        <a
                            href={`tel:${order.retailer?.phone}`}
                            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 active:scale-95 transition-transform"
                        >
                            <Phone size={18} />
                            Call
                        </a>
                    </div>
                </div>

                {isAssignedToOther && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-center font-medium">
                        Assigned to another driver
                    </div>
                )}

                {/* Actions Section - Only if not assigned to another */}
                {!isDelivered && !isAssignedToOther && (
                    <>
                        {/* Start Delivery Action (For Approved Orders) */}
                        {isApproved && (
                            <button
                                onClick={() => handleUpdateStatus('Dispatched')}
                                className="w-full bg-yellow-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-yellow-600 active:scale-95 transition-transform flex items-center justify-center gap-2 mb-4"
                            >
                                <Truck size={20} />
                                Start Delivery (Pick Up)
                            </button>
                        )}

                        {/* Payment Section */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-100">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <IndianRupee size={20} className="text-orange-500" />
                                Payment Collection
                            </h3>

                            <div className="bg-orange-50 p-3 rounded-lg mb-4 flex justify-between items-center">
                                <span className="text-orange-700 font-medium">Pending Amount</span>
                                <span className="text-xl font-bold text-orange-800">₹{pendingAmount}</span>
                            </div>

                            {Number(pendingAmount) > 0 ? (
                                <form onSubmit={handleCollectPayment} className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Amount to Collect</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                            value={paymentAmount}
                                            max={pendingAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Payment Mode</label>
                                        <select
                                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                            value={paymentMode}
                                            onChange={(e) => setPaymentMode(e.target.value)}
                                        >
                                            <option value="Cash">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Cheque">Cheque</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={collectingPayment}
                                        className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 mt-2"
                                    >
                                        {collectingPayment ? "Processing..." : "Collect & Update"}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center text-green-600 font-medium py-2">
                                    Payment Complete!
                                </div>
                            )}
                        </div>

                        {/* Mark Delivered Action */}
                        <button
                            onClick={() => handleUpdateStatus('Delivered')}
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={20} />
                            Mark as Delivered
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DeliveryDetails;
