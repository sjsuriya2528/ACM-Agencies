import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { CheckCircle, XCircle, Clock, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [expandedOrder, setExpandedOrder] = useState(null);

    const [drivers, setDrivers] = useState([]);

    useEffect(() => {
        fetchOrders();
        fetchDrivers();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders');
            setOrders(response.data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const response = await api.get('/users');
            setDrivers(response.data.filter(u => u.role === 'driver'));
        } catch (error) {
            console.error("Failed to fetch drivers", error);
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this order?`)) return;

        try {
            await api.put(`/orders/${orderId}/status`, { status });
            // Refresh orders locally
            setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
            alert(`Order ${status} successfully`);
        } catch (error) {
            console.error(`Failed to ${status} order`, error);
            alert(error.response?.data?.message || "Failed to update order status");
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.retailer?.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.salesRep?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toString().includes(searchTerm);
        const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'Requested': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Dispatched': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Delivered': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const toggleExpand = (id) => {
        setExpandedOrder(expandedOrder === id ? null : id);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Management</h1>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Retailer, Sales Rep, or ID..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400" size={20} />
                    <select
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Requested">Requested</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-600">ID</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Retailer</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Sales Rep</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Date</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Total</th>
                            <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                            <th className="p-4 text-sm font-semibold text-gray-600 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading orders...</td></tr>
                        ) : filteredOrders.length > 0 ? (
                            filteredOrders.map(order => (
                                <React.Fragment key={order.id}>
                                    <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleExpand(order.id)}>
                                        <td className="p-4 text-gray-600">#{order.id}</td>
                                        <td className="p-4 font-medium text-gray-800">{order.retailer?.shopName || 'Unknown'}</td>
                                        <td className="p-4 text-gray-600">{order.salesRep?.name || 'Unknown'}</td>
                                        <td className="p-4 text-gray-600 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 font-bold text-gray-800">₹{order.totalAmount}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {expandedOrder === order.id ? <ChevronUp size={20} className="mx-auto text-gray-400" /> : <ChevronDown size={20} className="mx-auto text-gray-400" />}
                                        </td>
                                    </tr>
                                    {/* Expanded Details */}
                                    {expandedOrder === order.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan="7" className="p-4">
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h3 className="font-semibold text-gray-800 mb-2">Order Items</h3>
                                                        {order.status === 'Requested' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'Approved'); }}
                                                                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                                                >
                                                                    <CheckCircle size={16} /> Approve
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'Rejected'); }}
                                                                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                                                >
                                                                    <XCircle size={16} /> Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {order.status === 'Approved' && (
                                                            <div className="text-sm text-gray-500 italic px-3 py-1.5">
                                                                Visible to all drivers
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {order.items?.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                                                                <div>
                                                                    <p className="font-medium text-gray-700">{item.Product?.name}</p>
                                                                    <p className="text-xs text-gray-500">₹{item.pricePerUnit} x {item.quantity}</p>
                                                                </div>
                                                                <p className="font-semibold text-gray-800">₹{item.totalPrice}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                                        {order.gpsLatitude && (
                                                            <div>
                                                                <p className="text-xs text-gray-500 mb-1">Location</p>
                                                                <a
                                                                    href={`https://www.google.com/maps?q=${order.gpsLatitude},${order.gpsLongitude}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                                                                >
                                                                    View on Google Maps
                                                                </a>
                                                            </div>
                                                        )}
                                                        {order.driverId && (
                                                            <div className="text-right">
                                                                <p className="text-xs text-gray-500 mb-1">Assigned Driver</p>
                                                                <p className="text-sm font-medium text-gray-800">
                                                                    {drivers.find(d => d.id === order.driverId)?.name || 'Unknown Driver'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-500">No orders found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>


        </div>
    );
};

export default Orders;
