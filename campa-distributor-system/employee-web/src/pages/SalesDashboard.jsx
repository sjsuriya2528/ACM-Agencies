import React, { useContext, useEffect, useState } from 'react';
import { ShoppingCart, Users, LogOut, FileText, CheckCircle, Clock, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const SalesDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalOrders: 0,
        requested: 0,
        accepted: 0,
        totalAmount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/orders');
                const orders = response.data;

                const totalOrders = orders.length;
                const requested = orders.filter(o => o.status === 'Requested').length;
                const accepted = orders.filter(o => o.status === 'Approved').length; // Assuming 'Approved' is 'Accepted'
                const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

                setStats({ totalOrders, requested, accepted, totalAmount });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Sales Dashboard</h1>
                    <p className="text-gray-600">Welcome, <span className="font-semibold text-blue-600">{user?.name}</span></p>
                </div>
                <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                    <LogOut size={20} />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">Total Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">Requested</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stats.requested}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">Accepted</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stats.accepted}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <IndianRupee size={20} />
                        </div>
                        <span className="text-gray-500 text-sm">Total Sales</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">₹{stats.totalAmount.toFixed(2)}</p>
                </div>
            </div>

            {/* Actions Grid */}
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => navigate('/create-order')} className="flex items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
                    <div className="p-4 bg-blue-100 rounded-full mr-4 group-hover:bg-blue-200 transition-colors">
                        <ShoppingCart size={24} className="text-blue-600" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-semibold text-gray-800">New Order</h2>
                        <p className="text-gray-500 text-sm">Create a new order</p>
                    </div>
                </button>

                <button onClick={() => navigate('/view-orders')} className="flex items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
                    <div className="p-4 bg-indigo-100 rounded-full mr-4 group-hover:bg-indigo-200 transition-colors">
                        <FileText size={24} className="text-indigo-600" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-semibold text-gray-800">View Orders</h2>
                        <p className="text-gray-500 text-sm">Track order status</p>
                    </div>
                </button>

                <button onClick={() => navigate('/retailers')} className="flex items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group">
                    <div className="p-4 bg-green-100 rounded-full mr-4 group-hover:bg-green-200 transition-colors">
                        <Users size={24} className="text-green-600" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-lg font-semibold text-gray-800">Retailers</h2>
                        <p className="text-gray-500 text-sm">Manage retailer list</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default SalesDashboard;
