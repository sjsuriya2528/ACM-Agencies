import React from 'react';

const DashboardHome = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-2">Total Sales</h2>
                    <p className="text-3xl font-bold text-green-600">₹ 0.00</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-2">Pending Orders</h2>
                    <p className="text-3xl font-bold text-yellow-600">0</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-2">Active Deliveries</h2>
                    <p className="text-3xl font-bold text-blue-600">0</p>
                </div>
            </div>

            <div className="mt-10 bg-white p-6 rounded-lg shadow h-96">
                <h2 className="text-xl font-semibold mb-4">Live Delivery Map</h2>
                <div className="bg-gray-200 h-full flex items-center justify-center">
                    Map Placeholder (Leaflet Integration Pending)
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
