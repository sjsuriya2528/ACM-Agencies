import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashboardHome from './DashboardHome';
import Products from './Products';
import Retailers from './Retailers';
import Users from './Users';
import Orders from './Orders';

const Dashboard = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 p-10 overflow-auto">
                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/retailers" element={<Retailers />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/deliveries" element={<div>Deliveries (Coming Soon)</div>} />
                    <Route path="/deliveries" element={<div>Deliveries (Coming Soon)</div>} />
                    <Route path="/payments" element={<div>Payments (Coming Soon)</div>} />
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
