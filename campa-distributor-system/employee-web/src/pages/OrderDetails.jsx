import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
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
                setOrder(response.data);
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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-xl font-bold text-gray-800">Order #{order.id}</h1>
            </div>

            <div className="p-4 space-y-4">
                {/* Status Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {order.status === 'Approved' ? 'Accepted' : order.status}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium text-gray-800">{new Date(order.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>

                {/* Retailer Details */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <MapPin size={18} className="text-blue-600" />
                        Retailer Details
                    </h2>
                    <div className="space-y-1">
                        <p className="text-lg font-bold text-gray-800">{order.retailer?.shopName}</p>
                        <p className="text-gray-600 text-sm">{order.retailer?.ownerName}</p>
                        <p className="text-gray-500 text-sm">{order.retailer?.address}</p>
                        <p className="text-gray-500 text-sm">{order.retailer?.phone}</p>
                        {order.gpsLatitude && (
                            <a
                                href={`https://www.google.com/maps?q=${order.gpsLatitude},${order.gpsLongitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-500 text-xs mt-2 inline-block hover:underline"
                            >
                                View Order Location on Maps
                            </a>
                        )}
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Package size={18} className="text-blue-600" />
                        Order Items
                    </h2>
                    <div className="divide-y divide-gray-50">
                        {order.items?.map((item, index) => {
                            const bottlesPerCrate = item.Product?.bottlesPerCrate || 24;
                            const crates = Math.floor(item.quantity / bottlesPerCrate);
                            const pieces = item.quantity % bottlesPerCrate;

                            return (
                                <div key={index} className="py-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-800">{item.Product?.name || 'Unknown Product'}</p>
                                        <p className="text-sm text-gray-500">
                                            {crates > 0 && `${crates} Crates `}
                                            {pieces > 0 && `${pieces} Pieces`}
                                            {crates === 0 && pieces === 0 && '0 Pieces'}
                                            <span className="text-gray-400 mx-1">•</span>
                                            ₹{item.pricePerUnit} / unit
                                        </p>
                                    </div>
                                    <p className="font-semibold text-gray-800">₹{item.totalPrice}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
                        <span className="font-bold text-gray-800">Total Amount</span>
                        <span className="text-xl font-bold text-blue-600">₹{order.totalAmount}</span>
                    </div>
                </div>

                {/* Invoice Info if Approved */}
                {order.Invoice && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                <FileText size={18} className="text-blue-600" />
                                Invoice Information
                            </h2>
                            <button
                                onClick={() => navigate(`/invoice/${order.Invoice.id}`)}
                                className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-100"
                            >
                                View Detailed Invoice
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Payment Status</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${order.Invoice.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {order.Invoice.paymentStatus}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-gray-600">Balance Amount</span>
                            <span className="font-medium">₹{order.Invoice.balanceAmount}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetails;
