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
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 transition-colors">
            {['daily', 'weekly', 'monthly', 'yearly'].map(tf => (
                <button
                    key={tf}
                    onClick={() => onChange(tf)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${current === tf ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                >
                    {tf}
                </button>
            ))}
        </div>
    );

    const StatCard = ({ title, value, icon: Icon, color, subtext, trend }) => (
        <div className="relative group bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/5 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-slate-950/40 transition-all duration-500 overflow-hidden">
            {/* Subtle Gradient Backdrop */}
            <div className={`absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 ${color}`}></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20 border border-slate-100 dark:border-white/5`}>
                        <Icon size={22} className={color.replace('bg-', 'text-').replace('/20', '')} />
                    </div>
                    {trend && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-full">
                            <ArrowUpRight size={12} className="text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">{trend}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-slate-500 dark:text-slate-500 text-[11px] font-bold uppercase tracking-[0.15em]">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {value}
                    </h3>
                </div>

                {subtext && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{subtext}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${color}`}></div>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) return <LoadingSpinner />;

    return (
        <div className="relative min-h-screen p-4 md:p-8 animate-fade-in-up space-y-10 overflow-hidden transition-colors duration-500">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-400/5 dark:bg-blue-400/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-emerald-400/5 dark:bg-emerald-400/10 rounded-full blur-[100px]"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-amber-400/5 dark:bg-amber-400/10 rounded-full blur-[80px]"></div>
            </div>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{user?.name || 'Admin'}</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-lg">Here's a digital overview of your distribution network</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 font-black tracking-tight">
                        <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                        {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard title="Total Sales" value={`₹${Number(stats.overall?.totalSales || 0).toLocaleString()}`} icon={IndianRupee} color="bg-blue-600" subtext="LIFETIME" trend="+12.5% vs last month" />
                <StatCard title="Orders Today" value={stats.today.totalOrders} icon={ShoppingBag} color="bg-indigo-600" subtext="TODAY" trend="Active fulfillment" />
                <StatCard title="Sales Today" value={`₹${Number(stats.today.totalSales).toLocaleString()}`} icon={IndianRupee} color="bg-emerald-600" subtext="REVENUE" trend="Target: ₹50k" />
                <StatCard title="Today Collection" value={`₹${Number(stats.today.totalCollection).toLocaleString()}`} icon={IndianRupee} color="bg-amber-600" subtext="COLLECTED" trend="Approved payments" />
                <StatCard title="Total Products" value={stats.inventory.totalProducts} icon={Box} color="bg-violet-600" subtext="INVENTORY" trend="Live items" />
                <StatCard title="Low Stock" value={stats.inventory.lowStockCount} icon={AlertTriangle} color="bg-rose-600" subtext="CRITICAL" trend="Needs restock" />
            </div>

            {/* Main Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales Chart */}
                <div className="bg-white dark:bg-slate-900 transition-colors p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
                            <TrendingUp size={20} className="text-blue-500 dark:text-blue-400" /> Sales Trend
                        </h3>
                        <TimeframeSelector current={salesTimeframe} onChange={setSalesTimeframe} />
                    </div>
                    <div className="h-[350px] relative">
                        {trendsLoading && salesTimeframe !== 'daily' && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
                            </div>
                        )}
                        <SalesLineChart data={salesTrend} />
                    </div>
                </div>

                {/* Collection Chart */}
                <div className="bg-white dark:bg-slate-900 transition-colors p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
                            <IndianRupee size={20} className="text-emerald-500 dark:text-emerald-400" /> Collection History
                        </h3>
                        <TimeframeSelector current={collectionTimeframe} onChange={setCollectionTimeframe} />
                    </div>
                    <div className="h-[350px] relative">
                        {trendsLoading && collectionTimeframe !== 'daily' && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                <RefreshCw className="animate-spin text-emerald-600 dark:text-emerald-400" size={32} />
                            </div>
                        )}
                        <CollectionLineChart data={collectionTrend} />
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Products */}
                <div className="bg-white dark:bg-slate-900 transition-colors p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 hover:shadow-md transition-shadow h-full">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tighter">
                        <Box size={20} className="text-violet-500 dark:text-violet-400" /> Top Products
                    </h3>
                    <div className="h-[300px]">
                        <ProductBarChart data={productSales} />
                    </div>
                </div>

                {/* Stock Table */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 transition-colors rounded-2xl shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/5 overflow-hidden hover:shadow-xl transition-shadow text-slate-900 dark:text-white">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center transition-colors">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
                            <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" /> Low Stock Alerts
                        </h3>
                        <span className="text-[10px] font-black bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 px-3 py-1 rounded-full uppercase tracking-wider">
                            Lowest Stock First
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/5">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 transition-colors">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Product Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stock Qty</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-white/5 transition-colors">
                                {stocks.map((product) => (
                                    <tr key={product.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors duration-200 group">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors uppercase">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-600 dark:text-slate-400">
                                            {product.stockQuantity}
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.stockQuantity < 50 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 uppercase tracking-wider transition-colors">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                    Critical
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-wider transition-colors">
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
