import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SalesLineChart, ProductBarChart, CollectionLineChart } from '../components/SalesChart';
import {
    ShoppingBag,
    IndianRupee,
    Box,
    AlertTriangle,
    TrendingUp,
    ArrowUpRight,
    Calendar,
    RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardHome = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        today: { totalOrders: 0, totalSales: 0, totalCollection: 0 },
        overall: { totalOrders: 0, totalSales: 0 },
        inventory: { totalProducts: 0, lowStockCount: 0 }
    });

    // Trend States
    const [salesTrend, setSalesTrend] = useState([]);
    const [collectionTrend, setCollectionTrend] = useState([]);
    const [productSales, setProductSales] = useState([]);
    const [stocks, setStocks] = useState([]);

    // Timeframe States
    const [salesTimeframe, setSalesTimeframe] = useState('daily');
    const [collectionTimeframe, setCollectionTimeframe] = useState('daily');

    const [loading, setLoading] = useState(true);
    const [trendsLoading, setTrendsLoading] = useState(false);

    const fetchSummaryData = async () => {
        try {
            const [summaryRes, productRes, stockRes] = await Promise.all([
                api.get('/analytics/summary'),
                api.get('/analytics/product-sales'),
                api.get('/analytics/stock')
            ]);
            setStats(summaryRes.data);
            setProductSales(productRes.data);
            setStocks(stockRes.data);
        } catch (error) {
            console.error("Error fetching summary data:", error);
        }
    };

    const fetchSalesTrend = async () => {
        try {
            setTrendsLoading(true);
            const res = await api.get(`/analytics/sales-trend?timeframe=${salesTimeframe}`);
            setSalesTrend(res.data);
        } catch (error) {
            console.error("Error fetching sales trend:", error);
        } finally {
            setTrendsLoading(false);
        }
    };

    const fetchCollectionTrend = async () => {
        try {
            setTrendsLoading(true);
            const res = await api.get(`/analytics/collection-trend?timeframe=${collectionTimeframe}`);
            setCollectionTrend(res.data);
        } catch (error) {
            console.error("Error fetching collection trend:", error);
        } finally {
            setTrendsLoading(false);
        }
    };

    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);
            await fetchSummaryData();
            await Promise.all([fetchSalesTrend(), fetchCollectionTrend()]);
            setLoading(false);
        };
        initDashboard();
    }, []);

    // Fetch trends when timeframes change
    useEffect(() => {
        if (!loading) fetchSalesTrend();
    }, [salesTimeframe]);

    useEffect(() => {
        if (!loading) fetchCollectionTrend();
    }, [collectionTimeframe]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const TimeframeSelector = ({ current, onChange }) => (
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {['daily', 'weekly', 'monthly', 'yearly'].map(tf => (
                <button
                    key={tf}
                    onClick={() => onChange(tf)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${current === tf ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    {tf}
                </button>
            ))}
        </div>
    );

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className={`relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
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

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-2 animate-fade-in-up space-y-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                        {getGreeting()}, {user?.name || 'Admin'}
                    </h1>
                    <p className="text-slate-500 mt-1">Here's what's happening today</p>
                </div>
                <div className="text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-slate-600 font-medium">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Sales" value={`₹ ${Number(stats.overall?.totalSales || 0).toLocaleString()}`} icon={IndianRupee} color="bg-emerald-600" subtext="Lifetime Sales" />
                <StatCard title="Orders Today" value={stats.today.totalOrders} icon={ShoppingBag} color="bg-blue-500" subtext="Processing" />
                <StatCard title="Sales Today" value={`₹ ${Number(stats.today.totalSales).toLocaleString()}`} icon={IndianRupee} color="bg-emerald-500" subtext="Revenue" />
                <StatCard title="Today Collection" value={`₹ ${Number(stats.today.totalCollection).toLocaleString()}`} icon={IndianRupee} color="bg-amber-500" subtext="Cash/UPI/Bank" />
                <StatCard title="Total Products" value={stats.inventory.totalProducts} icon={Box} color="bg-violet-500" subtext="In Inventory" />
                <StatCard title="Low Stock" value={stats.inventory.lowStockCount} icon={AlertTriangle} color="bg-rose-500" subtext="Action Needed" />
            </div>

            {/* Main Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                            <TrendingUp size={20} className="text-blue-500" /> Sales Trend
                        </h3>
                        <TimeframeSelector current={salesTimeframe} onChange={setSalesTimeframe} />
                    </div>
                    <div className="h-[350px] relative">
                        {trendsLoading && salesTimeframe !== 'daily' && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <RefreshCw className="animate-spin text-blue-600" size={32} />
                            </div>
                        )}
                        <SalesLineChart data={salesTrend} />
                    </div>
                </div>

                {/* Collection Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                            <IndianRupee size={20} className="text-emerald-500" /> Collection History
                        </h3>
                        <TimeframeSelector current={collectionTimeframe} onChange={setCollectionTimeframe} />
                    </div>
                    <div className="h-[350px] relative">
                        {trendsLoading && collectionTimeframe !== 'daily' && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <RefreshCw className="animate-spin text-emerald-600" size={32} />
                            </div>
                        )}
                        <CollectionLineChart data={collectionTrend} />
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Products */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow h-full">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter">
                        <Box size={20} className="text-violet-500" /> Top Products
                    </h3>
                    <div className="h-[300px]">
                        <ProductBarChart data={productSales} />
                    </div>
                </div>

                {/* Stock Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tighter">
                            <AlertTriangle size={20} className="text-rose-500" /> Low Stock Alerts
                        </h3>
                        <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-3 py-1 rounded-full uppercase tracking-wider">
                            Lowest Stock First
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Product Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Stock Qty</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {stocks.map((product) => (
                                    <tr key={product.id} className="hover:bg-blue-50/50 transition-colors duration-200 group">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors uppercase">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-600">
                                            {product.stockQuantity}
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.stockQuantity < 50 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                    Critical
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
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
        </div>
    );
};

export default DashboardHome;
