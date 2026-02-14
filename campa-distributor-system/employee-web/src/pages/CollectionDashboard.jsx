import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { IndianRupee, FileText, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CollectionDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Collection Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">Welcome, {user?.name}</span>
                    <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => navigate('/collect-payment')} className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                    <div className="p-4 bg-purple-100 rounded-full mb-4">
                        <IndianRupee size={32} className="text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Collect Payment</h2>
                    <p className="text-gray-500 text-sm mt-2">Record a new payment from retailer</p>
                </button>

                <button onClick={() => navigate('/payment-history')} className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                    <div className="p-4 bg-indigo-100 rounded-full mb-4">
                        <FileText size={32} className="text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
                    <p className="text-gray-500 text-sm mt-2">View past collections</p>
                </button>
            </div>
        </div>
    );
};

export default CollectionDashboard;
