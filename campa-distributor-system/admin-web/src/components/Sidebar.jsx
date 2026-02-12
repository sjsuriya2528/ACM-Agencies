import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div className="w-64 h-screen bg-gray-800 text-white flex flex-col">
            <div className="p-4 text-2xl font-bold">Campa Admin</div>
            <nav className="flex-1 p-4 space-y-2">
                <Link to="/" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
                    Dashboard
                </Link>
                <Link to="/orders" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
                    Orders
                </Link>
                <Link to="/products" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
                    Products
                </Link>
                <Link to="/retailers" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
                    Retailers
                </Link>
                <Link to="/deliveries" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
                    Deliveries
                </Link>
                <Link to="/payments" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-700">
                    Payments
                </Link>
            </nav>
            <div className="p-4">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
