import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashboardHome from './DashboardHome';
import Products from './Products';
import Retailers from './Retailers';
import RetailerDetail from './RetailerDetail';
import Users from './Users';
import Orders from './Orders';
import Payments from './Payments';
import Reports from './Reports';
import LedgerReport from './LedgerReport';
import Deliveries from './Deliveries';
import RepPerformance from './RepPerformance';
import Purchases from './Purchases';

const Dashboard = () => {
    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <Sidebar />
            <div className="flex-1 p-8 overflow-y-auto">
                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/retailers" element={<Retailers />} />
                    <Route path="/retailers/:id" element={<RetailerDetail />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/deliveries" element={<Deliveries />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/ledger-report" element={<LedgerReport />} />
                    <Route path="/rep-performance" element={<RepPerformance />} />
                    <Route path="/purchases" element={<Purchases />} />
                </Routes>
            </div>
        </div>
    );
};

export default Dashboard;
