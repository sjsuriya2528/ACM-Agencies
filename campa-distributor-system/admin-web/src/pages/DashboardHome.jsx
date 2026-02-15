import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { SalesLineChart, ProductBarChart } from '../components/SalesChart';
import {
    ShoppingBag,
    IndianRupee,
    Box,
    AlertTriangle,
    ArrowUpRight
} from 'lucide-react';

const DashboardHome = () => {
    const [stats, setStats] = useState({
        today: { totalOrders: 0, totalSales: 0 },
        overall: { totalOrders: 0, totalSales: 0 },
        inventory: { totalProducts: 0, lowStockCount: 0 }
    });
    const [salesTrend, setSalesTrend] = useState([]);
    const [productSales, setProductSales] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryRes, trendRes, productRes, stockRes] = await Promise.all([
                    api.get('/analytics/summary'),
                    api.get('/analytics/sales-trend'),
                    api.get('/analytics/product-sales'),
                    api.get('/analytics/stock')
                ]);

                setStats(summaryRes.data);
                setSalesTrend(trendRes.data);
                setProductSales(productRes.data);
                setStocks(stockRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className={`relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            {/* Background Decoration */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${color}`}></div>

            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-1">{title}</p>
                    <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
                    {subtext && <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${color.replace('bg-', 'text-')}`}>
                        <ArrowUpRight size={12} /> {subtext}
                    </p>}
                </div>
                <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
                    <Icon size={24} className={color.replace('bg-', 'text-').replace('/20', '')} />
                </div>
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[500px]">
            <div className="relative">
                <div className="w-12 h-12 rounded-full absolute border-4 border-solid border-gray-200"></div>
                <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-solid border-blue-500 border-t-transparent"></div>
            </div>
        </div>
    );

    return (
        <div className="p-2 animate-fade-in-up space-y-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Overview of your distribution performance</p>
                </div>
                <div className="text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-slate-600 font-medium">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Total Sales"
                    value={`₹ ${Number(stats.overall?.totalSales || 0).toLocaleString()}`}
                    icon={IndianRupee}
                    color="bg-emerald-600"
                    subtext="Lifetime Sales"
                />
                <StatCard
                    title="Orders Today"
                    value={stats.today.totalOrders}
                    icon={ShoppingBag}
                    color="bg-blue-500"
                    subtext="Processing"
                />
                <StatCard
                    title="Sales Today"
                    value={`₹ ${Number(stats.today.totalSales).toLocaleString()}`}
                    icon={IndianRupee}
                    color="bg-emerald-500"
                    subtext="Revenue"
                />
                <StatCard
                    title="Total Products"
                    value={stats.inventory.totalProducts}
                    icon={Box}
                    color="bg-violet-500"
                    subtext="In Inventory"
                />
                <StatCard
                    title="Low Stock"
                    value={stats.inventory.lowStockCount}
                    icon={AlertTriangle}
                    color="bg-rose-500"
                    subtext="Action Needed"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <ShoppingBag size={20} className="text-blue-500" /> Sales Trend
                    </h3>
                    <div className="h-[300px]">
                        <SalesLineChart data={salesTrend} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Box size={20} className="text-violet-500" /> Top Products
                    </h3>
                    <div className="h-[300px]">
                        <ProductBarChart data={productSales} />
                    </div>
                </div>
            </div>

            {/* Stock Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-rose-500" /> Low Stock Alerts
                    </h3>
                    <span className="text-xs font-semibold bg-rose-100 text-rose-700 px-3 py-1 rounded-full">
                        Lowest Stock First
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Qty</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {stocks.map((product, idx) => (
                                <tr key={product.id} className="hover:bg-blue-50/50 transition-colors duration-200 group">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                                        {product.stockQuantity}
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.stockQuantity < 50 ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                Critical
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                In Stock
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
