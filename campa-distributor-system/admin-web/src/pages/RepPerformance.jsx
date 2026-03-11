import React, { useEffect, useState, useMemo, useRef } from 'react';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BarChart2,
    IndianRupee,
    ShoppingBag,
    Wallet,
    Calendar,
    Download,
    User,
    TrendingUp,
    TrendingDown,
    Activity as ActivityLog,
    RefreshCcw,
    Clock,
    CheckCircle,
    ExternalLink
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import LoadingSpinner from '../components/LoadingSpinner';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const getPresetRange = (preset) => {
    const today = new Date();
    const toStr = (d) => d.toISOString().split('T')[0];

    if (preset === 'today') {
        const s = toStr(today);
        return { startDate: s, endDate: s };
    }
    if (preset === 'week') {
        const start = new Date(today);
        start.setDate(today.getDate() - 6);
        return { startDate: toStr(start), endDate: toStr(today) };
    }
    if (preset === 'month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: toStr(start), endDate: toStr(today) };
    }
    return null;
};

// ─── Component ───────────────────────────────────────────────────────────────
const RepPerformance = () => {
    // Inject Outfit Font
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => document.head.removeChild(link);
    }, []);

    const [reps, setReps] = useState([]);
    const [selectedRep, setSelectedRep] = useState('');
    const [period, setPeriod] = useState('week');  // 'today' | 'week' | 'month' | 'custom'
    const [customRange, setCustomRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null); // { rows, totals }
    const [exporting, setExporting] = useState(false);

    // ── Fetch rep list ──────────────────────────────────────────────────────
    useEffect(() => {
        api.get('/analytics/rep-list').then(r => {
            setReps(r.data);
            if (r.data.length > 0) setSelectedRep(String(r.data[0].id));
        }).catch(console.error);
    }, []);

    // ── Compute date range from period preset ───────────────────────────────
    const getDateRange = () => {
        if (period === 'custom') return customRange;
        return getPresetRange(period);
    };

    // ── Fetch history ───────────────────────────────────────────────────────
    const fetchHistory = async () => {
        if (!selectedRep) return;
        const range = getDateRange();
        setLoading(true);
        setData(null);
        try {
            const res = await api.get('/analytics/rep-history', {
                params: { repId: selectedRep, ...range, _t: Date.now() }
            });
            console.log('Rep History Response:', res.data);
            setData(res.data);
        } catch (err) {
            console.error('Fetch Error:', err);
            alert('Failed to fetch data. Check console.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch whenever rep or period changes (not custom to avoid mid-typing fetches)
    useEffect(() => {
        if (selectedRep && period !== 'custom') fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRep, period]);

    // ── Chart data ──────────────────────────────────────────────────────────
    const chartLabels = data ? data.rows.map(r => new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })) : [];

    const barChartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Sales (₹)',
                data: data ? data.rows.map(r => r.sales) : [],
                backgroundColor: 'rgba(59, 130, 246, 0.75)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderRadius: 6,
                borderWidth: 1
            },
            {
                label: 'Collections (₹)',
                data: data ? data.rows.map(r => r.collections) : [],
                backgroundColor: 'rgba(245, 158, 11, 0.75)',
                borderColor: 'rgba(245, 158, 11, 1)',
                borderRadius: 6,
                borderWidth: 1
            }
        ]
    };

    const lineChartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Sales (₹)',
                data: data ? data.rows.map(r => r.sales) : [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4
            },
            {
                label: 'Collections (₹)',
                data: data ? data.rows.map(r => r.collections) : [],
                borderColor: 'rgb(245, 158, 11)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'top',
                labels: {
                    font: { family: "'Outfit', sans-serif", size: 12, weight: '700' },
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { family: "'Outfit', sans-serif", size: 14, weight: '800' },
                bodyFont: { family: "'Outfit', sans-serif", size: 13 },
                padding: 15,
                cornerRadius: 12,
                displayColors: true,
                callbacks: {
                    label: (ctx) => ` ₹ ${Number(ctx.raw).toLocaleString('en-IN')}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(241, 245, 249, 1)', drawBorder: false },
                ticks: {
                    font: { family: "'Outfit', sans-serif", weight: '600' },
                    callback: (val) => '₹' + Number(val).toLocaleString('en-IN')
                }
            },
            x: {
                grid: { display: false },
                ticks: { font: { family: "'Outfit', sans-serif", weight: '600' } }
            }
        }
    };

    // ── PDF Export ──────────────────────────────────────────────────────────
    const downloadPDF = async () => {
        if (!data) return;
        setExporting(true);
        try {
            const rep = reps.find(r => String(r.id) === String(selectedRep));
            const range = getDateRange();
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.text('ACM AGENCIES', 105, 15, { align: 'center' });

            doc.setFontSize(14);
            doc.text('Rep Performance Report', 105, 25, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Rep: ${rep?.name || 'Unknown'} (${rep?.role?.replace('_', ' ') || ''})`, 105, 33, { align: 'center' });
            doc.text(`Period: ${range.startDate} to ${range.endDate}`, 105, 39, { align: 'center' });

            // Summary box
            doc.setFontSize(11);
            doc.setTextColor(40);
            const { totalSales, totalCollections, totalOrders } = data.totals;
            doc.text(`Total Sales: Rs. ${fmt(totalSales)}   |   Total Collections: Rs. ${fmt(totalCollections)}   |   Orders: ${totalOrders}`, 105, 48, { align: 'center' });

            autoTable(doc, {
                startY: 55,
                head: [['Date', 'Orders Details', 'Sales (Rs.)', 'Collections (Rs.)']],
                body: data.rows.map(r => [
                    new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN'),
                    (r.ordersList || []).map(o => `#${o.invoiceNumber} - ${o.customerName} (Rs. ${fmt(o.amount)})`).join('\n') || 'No details',
                    `Rs. ${fmt(r.sales)}`,
                    `Rs. ${fmt(r.collections)}`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [51, 65, 85] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                styles: { cellPadding: 3, fontSize: 8 },
                columnStyles: {
                    1: { cellWidth: 80 }
                },
                foot: [[
                    'TOTAL',
                    totalOrders,
                    `Rs. ${fmt(totalSales)}`,
                    `Rs. ${fmt(totalCollections)}`
                ]],
                footStyles: { fillColor: [226, 232, 240], textColor: [30, 41, 59], fontStyle: 'bold' }
            });

            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
            }

            const fileName = `Rep_Performance_${rep?.name?.replace(/ /g, '_')}_${range.startDate}_to_${range.endDate}.pdf`;
            doc.save(fileName);
        } catch (err) {
            console.error(err);
            alert('Failed to export PDF');
        } finally {
            setExporting(false);
        }
    };

    // ── Selected rep info ───────────────────────────────────────────────────
    const repInfo = reps.find(r => String(r.id) === String(selectedRep));
    const roleLabel = {
        sales_rep: 'Sales Rep',
        driver: 'Driver',
        collection_agent: 'Collection Agent'
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="animate-fade-in-up space-y-8 p-4 md:p-8 bg-[#F8FAFC]/50 min-h-screen" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        <TrendingUp size={12} /> Analytics Engine Online
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <span className="p-3 bg-white rounded-3xl shadow-xl shadow-blue-100/50 border border-slate-100">
                            <BarChart2 className="text-blue-600" size={40} />
                        </span>
                        Rep Performance
                    </h1>
                    <p className="text-slate-500 font-medium text-lg ml-1">Real-time intelligence for your field team</p>
                </div>
            </header>

            {/* Controls */}
            <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white/60 flex flex-wrap gap-8 items-end relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-80" />
                
                {/* Rep selector */}
                <div className="flex-1 min-w-[280px] space-y-3">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.15em] ml-1">
                        Deployment Unit
                    </label>
                    <div className="relative group/select">
                        <select
                            value={selectedRep}
                            onChange={e => setSelectedRep(e.target.value)}
                            className="w-full pl-5 pr-12 py-4 bg-slate-50/50 border-2 border-slate-100/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none text-slate-800 font-bold hover:bg-white hover:border-blue-200"
                        >
                            {reps.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.name} — {roleLabel[r.role] || r.role}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover/select:text-blue-500 transition-colors">
                            <User size={20} />
                        </div>
                    </div>
                </div>

                {/* Period presets */}
                <div className="space-y-3">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.15em] ml-1">
                        Timeline Horizon
                    </label>
                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 gap-1">
                        {[
                            { key: 'today', label: 'Today' },
                            { key: 'week', label: 'Wk' },
                            { key: 'month', label: 'Mo' },
                            { key: 'custom', label: 'Custom' }
                        ].map(p => (
                            <button
                                key={p.key}
                                onClick={() => setPeriod(p.key)}
                                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all tracking-tight ${period === p.key
                                    ? 'bg-white text-blue-600 shadow-md border border-blue-50'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom date range */}
                {period === 'custom' && (
                    <div className="flex gap-4 items-end flex-wrap animate-scale-in">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From</label>
                            <input
                                type="date"
                                value={customRange.startDate}
                                onChange={e => setCustomRange(p => ({ ...p, startDate: e.target.value }))}
                                className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold text-slate-700"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To</label>
                            <input
                                type="date"
                                value={customRange.endDate}
                                onChange={e => setCustomRange(p => ({ ...p, endDate: e.target.value }))}
                                className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold text-slate-700"
                            />
                        </div>
                        <button
                            onClick={fetchHistory}
                            className="px-6 py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-slate-200"
                        >
                            Sync Range
                        </button>
                    </div>
                )}

                {/* PDF Export */}
                <button
                    onClick={downloadPDF}
                    disabled={exporting || !data || data.rows.length === 0}
                    className="ml-auto px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center gap-3 transition-all shadow-xl shadow-emerald-200/50 active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                    {exporting ? <LoadingSpinner size="sm" /> : <Download size={18} />}
                    Export Analysis
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-16">
                    <LoadingSpinner />
                </div>
            )}

            {/* Results */}
            {!loading && data && (
                <div className="space-y-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        {/* Rep name badge */}
                        {repInfo && (
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-blue-50">
                                    {repInfo.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-slate-800 text-2xl tracking-tight">{repInfo.name}</p>
                                        <span className="bg-slate-100 text-slate-600 text-[10px] uppercase font-black px-2 py-0.5 rounded-md tracking-wider">
                                            {roleLabel[repInfo.role] || repInfo.role}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium">{repInfo.email}</p>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                             <button
                                onClick={() => fetchHistory()}
                                className="px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                                title="Force Refresh"
                            >
                                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                                Sync Data
                            </button>
                            <button
                                onClick={downloadPDF}
                                disabled={exporting || !data || data.rows.length === 0}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-100 active:scale-95 disabled:opacity-50"
                            >
                                {exporting ? <LoadingSpinner size="sm" /> : <Download size={16} />}
                                Export Report
                            </button>
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StatCard
                            title="Revenue Flow"
                            value={`₹${fmt(data.totals.totalSales)}`}
                            icon={TrendingUp}
                            color="bg-blue-600"
                            sub="Total billed amount"
                            trend="+12.4%"
                            pulse={period === 'today'}
                        />
                        <StatCard
                            title="Cash Liquidity"
                            value={`₹${fmt(data.totals.totalCollections)}`}
                            icon={Wallet}
                            color="bg-amber-500"
                            sub="Actual collections"
                            trend="+8.2%"
                        />
                        <StatCard
                            title="Order Volume"
                            value={data.totals.totalOrders}
                            icon={ShoppingBag}
                            color="bg-emerald-500"
                            sub="Invoices processed"
                            pulse={period === 'today'}
                        />
                    </div>

                    {data.rows.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 py-24 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <ActivityLog size={40} className="text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold text-lg italic">No activity found for this period</p>
                            <p className="text-slate-300 text-sm max-w-xs mx-auto">Try selecting a different date range or representative to see data.</p>
                        </div>
                    ) : (
                        <>
                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="bg-white/70 backdrop-blur-2xl p-10 rounded-[3rem] shadow-xl shadow-blue-100/20 border border-white/50 overflow-hidden relative group/chart">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/chart:opacity-[0.08] transition-opacity duration-700">
                                        <BarChart2 size={120} />
                                    </div>
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="font-black text-slate-800 flex items-center gap-3 text-sm uppercase tracking-[0.25em]">
                                            <div className="w-2 h-8 bg-blue-600 rounded-full" />
                                            Volume Analysis
                                        </h3>
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-200" />
                                            <div className="w-3 h-3 rounded-full bg-slate-200" />
                                        </div>
                                    </div>
                                    <div className="h-[340px] relative z-10 transition-transform duration-700 group-hover/chart:scale-[1.02]">
                                        <Bar data={barChartData} options={chartOptions} />
                                    </div>
                                </div>

                                <div className="bg-white/70 backdrop-blur-2xl p-10 rounded-[3rem] shadow-xl shadow-amber-100/20 border border-white/50 overflow-hidden relative group/chart">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/chart:opacity-[0.08] transition-opacity duration-700">
                                        <TrendingUp size={120} />
                                    </div>
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="font-black text-slate-800 flex items-center gap-3 text-sm uppercase tracking-[0.25em]">
                                            <div className="w-2 h-8 bg-amber-500 rounded-full" />
                                            Momentum Trend
                                        </h3>
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-200" />
                                            <div className="w-3 h-3 rounded-full bg-slate-200" />
                                        </div>
                                    </div>
                                    <div className="h-[340px] relative z-10 transition-transform duration-700 group-hover/chart:scale-[1.02]">
                                        <Line data={lineChartData} options={chartOptions} />
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Activity */}
                            <div className="space-y-12">
                                <div className="flex items-end justify-between px-2">
                                    <div className="space-y-2">
                                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                                            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                                                <ActivityLog className="text-white" size={32} />
                                            </div>
                                            Execution Logs
                                        </h3>
                                        <p className="text-slate-400 font-bold text-sm ml-1 uppercase tracking-widest">Temporal activity analysis</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <span className="bg-white/80 backdrop-blur-md text-blue-700 px-6 py-2 rounded-2xl text-xs font-black border border-blue-100/50 shadow-sm tracking-[0.15em]">
                                            {data.rows.length} OPERATIONAL DAYS
                                        </span>
                                        {data?.v && (
                                            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] bg-slate-200 text-slate-700 font-black px-2 py-0.5 rounded-md">ENGINE v{data.v}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SIG: {data.debugId}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="relative space-y-12 before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                    {data.rows.map((row, i) => (
                                        <div key={i} className="relative flex items-start gap-12 group animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                                            {/* Icon */}
                                            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-125 text-slate-400 shadow-xl transition-all duration-500 z-10 -translate-x-1/2">
                                                <Calendar size={20} />
                                            </div>
                                            {/* Card */}
                                            <div className="flex-1 bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/30 border border-white/60 group-hover:border-blue-200 group-hover:shadow-2xl group-hover:shadow-blue-100/30 transition-all duration-700 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-2 h-full bg-slate-100 group-hover:bg-blue-500 transition-colors duration-700" />
                                                
                                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                                    <div>
                                                        <time className="font-black text-slate-900 text-3xl tracking-tighter">
                                                            {new Date(row.date + 'T00:00:00').toLocaleDateString('en-IN', {
                                                                weekday: 'long', day: '2-digit', month: 'short', year: 'numeric'
                                                            })}
                                                        </time>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Summary</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Sales</span>
                                                            <span className="text-xl font-black bg-blue-600 text-white px-5 py-2 rounded-2xl shadow-lg shadow-blue-200 tracking-tighter">
                                                                ₹{fmt(row.sales)}
                                                            </span>
                                                        </div>
                                                        {row.collections > 0 && (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Collections</span>
                                                                <span className="text-xl font-black bg-amber-500 text-white px-5 py-2 rounded-2xl shadow-lg shadow-amber-200 tracking-tighter">
                                                                    ₹{fmt(row.collections)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {(row.ordersList || []).map((order, idx) => (
                                                        <div key={idx} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100/80 hover:bg-white hover:border-blue-100/50 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-500 group/order cursor-default">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">#{order.invoiceNumber}</span>
                                                                        <span className={`text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase shadow-sm ${
                                                                            order.paymentStatus === 'Paid' ? 'bg-emerald-500 text-white shadow-emerald-100' :
                                                                            order.paymentStatus === 'Partially Paid' ? 'bg-amber-400 text-white shadow-amber-100' :
                                                                            'bg-slate-400 text-white shadow-slate-100'
                                                                        }`}>
                                                                            {order.paymentStatus}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-lg font-black text-slate-800 tracking-tight">{order.customerName}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-blue-600 font-black text-xl tracking-tighter">₹{fmt(order.amount)}</p>
                                                                    <div className="flex items-center justify-end gap-1.5 mt-1.5">
                                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{order.orderStatus}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {order.items && order.items.length > 0 && (
                                                                <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap gap-2.5">
                                                                    {order.items.map((item, ii) => (
                                                                        <div key={ii} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors group/item">
                                                                            <ShoppingBag size={12} className="text-blue-500 transition-transform group-hover/item:scale-125" />
                                                                            <span className="text-[11px] font-bold text-slate-600">
                                                                                {item.name} <span className="text-blue-600 font-black ml-1.5">×{item.qty}</span>
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                {(!row.ordersList || row.ordersList.length === 0) && row.orders > 0 && (
                                                    <div className="flex flex-col items-center justify-center py-12 bg-red-50/50 rounded-[2.5rem] border-4 border-dashed border-red-100 relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-red-500 opacity-[0.02] animate-pulse" />
                                                        <RefreshCcw size={40} className="text-red-400 mb-4 animate-spin-slow" />
                                                        <p className="text-sm text-red-700 font-black uppercase tracking-[0.2em] text-center">Data Desync Detected</p>
                                                        <p className="text-[11px] text-red-500 mt-3 font-bold max-w-[240px] text-center px-4 leading-relaxed uppercase tracking-wide">
                                                            Cache mismatch. Execute <span className="text-red-700">npm run dev</span> to re-index.
                                                        </p>
                                                        <div className="mt-6 flex items-center gap-3 bg-white px-5 py-2.5 rounded-full border border-red-100 shadow-xl shadow-red-100/50">
                                                            <ShoppingBag size={16} className="text-red-500" />
                                                            <span className="text-[11px] text-red-600 font-black uppercase tracking-[0.1em]">{row.orders} HIDDEN TRANSACTIONS</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Empty state — no fetch yet */}
            {!loading && !data && (
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 py-32 text-center space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-500">
                        <BarChart2 size={48} className="text-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Ready to Analyze?</h3>
                        <p className="text-slate-400 font-medium max-w-sm mx-auto">Select a representative and a target period to start tracking performance metrics and activities.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, sub, trend, pulse }) => {
    return (
        <div className="group relative overflow-hidden bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-sm border border-white/40 hover:shadow-2xl hover:shadow-blue-100/40 transition-all duration-700 transform hover:-translate-y-2 active:scale-95 group">
            {/* Background Glow */}
            <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-1000 blur-3xl ${color}`} />
            <div className={`absolute -left-12 -bottom-12 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-all duration-1000 blur-2xl ${color}`} />
            
            <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-3.5 rounded-2xl ${color} bg-opacity-10 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                            <Icon size={22} className={color.replace('bg-', 'text-')} />
                        </div>
                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.25em]">{title}</p>
                    </div>
                    {pulse && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full shadow-sm border border-white/80">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`}></span>
                            </span>
                            <span className="text-[9px] font-black text-slate-500 uppercase">Live</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                        <h3 className="text-5xl font-black text-slate-900 tracking-tighter transition-all duration-500 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-600">
                            {value}
                        </h3>
                    </div>
                    {sub && (
                        <div className="flex items-center gap-2.5 pt-1">
                            {trend && (
                                <div className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-100 shadow-sm">
                                    <TrendingUp size={11} className="mr-1 shadow-sm" /> {trend}
                                </div>
                            )}
                            <p className="text-[12px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors uppercase tracking-tight">{sub}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Accent */}
            <div className={`absolute bottom-0 left-0 h-1.5 w-0 group-hover:w-full transition-all duration-1000 ease-out ${color} opacity-30`} />
        </div>
    );
};

export default RepPerformance;
