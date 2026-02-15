import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashboardHome from './DashboardHome';
import Products from './Products';
import Retailers from './Retailers';
import Users from './Users';
import Orders from './Orders';
import Payments from './Payments';
import Deliveries from './Deliveries';

const Dashboard = () => {
    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar />
            <div className="flex-1 p-8 overflow-y-auto">
                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/retailers" element={<Retailers />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/deliveries" element={<Deliveries />} />
                    <Route path="/payments" element={<Payments />} />
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
