import React, { useEffect, useState } from 'react';
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
    TrendingDown
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
                params: { repId: selectedRep, ...range }
            });
            setData(res.data);
        } catch (err) {
            console.error(err);
            alert('Failed to fetch rep history');
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
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ₹ ${Number(ctx.raw).toLocaleString('en-IN')}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (val) => '₹' + Number(val).toLocaleString('en-IN')
                }
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
                head: [['Date', 'Orders', 'Sales (Rs.)', 'Collections (Rs.)']],
                body: data.rows.map(r => [
                    new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN'),
                    r.orders,
                    `Rs. ${fmt(r.sales)}`,
                    `Rs. ${fmt(r.collections)}`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [51, 65, 85] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
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
        <div className="animate-fade-in-up space-y-8">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <BarChart2 className="text-blue-500" size={36} />
                        Rep Performance
                    </h1>
                    <p className="text-slate-500 mt-1">Track sales and collections for any team member</p>
                </div>
            </header>

            {/* Controls */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-6 items-end">
                {/* Rep selector */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                        <User size={15} /> Select Rep
                    </label>
                    <select
                        value={selectedRep}
                        onChange={e => setSelectedRep(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-700 font-medium"
                    >
                        {reps.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.name} — {roleLabel[r.role] || r.role}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Period presets */}
                <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                        <Calendar size={15} /> Period
                    </label>
                    <div className="flex gap-2">
                        {[
                            { key: 'today', label: 'Today' },
                            { key: 'week', label: 'This Week' },
                            { key: 'month', label: 'This Month' },
                            { key: 'custom', label: 'Custom' }
                        ].map(p => (
                            <button
                                key={p.key}
                                onClick={() => setPeriod(p.key)}
                                className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${period === p.key
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom date range */}
                {period === 'custom' && (
                    <div className="flex gap-3 items-end flex-wrap">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
                            <input
                                type="date"
                                value={customRange.startDate}
                                onChange={e => setCustomRange(p => ({ ...p, startDate: e.target.value }))}
                                className="px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
                            <input
                                type="date"
                                value={customRange.endDate}
                                onChange={e => setCustomRange(p => ({ ...p, endDate: e.target.value }))}
                                className="px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <button
                            onClick={fetchHistory}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm transition-all active:scale-95"
                        >
                            Fetch
                        </button>
                    </div>
                )}

                {/* PDF Export */}
                <button
                    onClick={downloadPDF}
                    disabled={exporting || !data || data.rows.length === 0}
                    className="ml-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {exporting ? <LoadingSpinner size="sm" /> : <Download size={16} />}
                    Export PDF
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
                <>
                    {/* Rep name badge */}
                    {repInfo && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                {repInfo.name[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-lg">{repInfo.name}</p>
                                <p className="text-sm text-slate-400">{roleLabel[repInfo.role] || repInfo.role} • {repInfo.email}</p>
                            </div>
                        </div>
                    )}

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="Total Sales"
                            value={`₹ ${fmt(data.totals.totalSales)}`}
                            icon={IndianRupee}
                            color="bg-blue-500"
                            sub="Revenue generated"
                        />
                        <StatCard
                            title="Total Collections"
                            value={`₹ ${fmt(data.totals.totalCollections)}`}
                            icon={Wallet}
                            color="bg-amber-500"
                            sub="Cash / UPI / Bank"
                        />
                        <StatCard
                            title="Total Orders"
                            value={data.totals.totalOrders}
                            icon={ShoppingBag}
                            color="bg-emerald-500"
                            sub="Bills generated"
                        />
                    </div>

                    {data.rows.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-16 text-center text-slate-400 italic text-sm">
                            No activity found for this rep in the selected period.
                        </div>
                    ) : (
                        <>
                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <TrendingUp size={18} className="text-blue-500" /> Sales vs Collections (Bar)
                                    </h3>
                                    <div className="h-[280px]">
                                        <Bar data={barChartData} options={chartOptions} />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                                        <TrendingDown size={18} className="text-amber-500" /> Trend Line
                                    </h3>
                                    <div className="h-[280px]">
                                        <Line data={lineChartData} options={chartOptions} />
                                    </div>
                                </div>
                            </div>

                            {/* History Table */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                    <Calendar size={18} className="text-slate-500" />
                                    <h3 className="font-bold text-slate-700">Daily History</h3>
                                    <span className="ml-auto text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                        {data.rows.length} days
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold">Date</th>
                                                <th className="px-6 py-4 text-center font-semibold">Orders</th>
                                                <th className="px-6 py-4 text-right font-semibold">Sales (₹)</th>
                                                <th className="px-6 py-4 text-right font-semibold">Collections (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-50 text-sm font-medium">
                                            {data.rows.map((row, i) => (
                                                <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                                                    <td className="px-6 py-4 text-slate-700">
                                                        {new Date(row.date + 'T00:00:00').toLocaleDateString('en-IN', {
                                                            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                                            {row.orders}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-semibold text-blue-700">
                                                        ₹ {fmt(row.sales)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-semibold text-amber-600">
                                                        ₹ {fmt(row.collections)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50 border-t border-slate-200">
                                            <tr>
                                                <td className="px-6 py-4 font-bold text-slate-700 uppercase text-xs tracking-wide">Total</td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-700">{data.totals.totalOrders}</td>
                                                <td className="px-6 py-4 text-right font-bold text-blue-700">₹ {fmt(data.totals.totalSales)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-amber-600">₹ {fmt(data.totals.totalCollections)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Empty state — no fetch yet */}
            {!loading && !data && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 py-20 text-center space-y-3">
                    <BarChart2 size={40} className="mx-auto text-slate-300" />
                    <p className="text-slate-400 font-medium">Select a rep and a period to view performance</p>
                </div>
            )}
        </div>
    );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, sub }) => (
    <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${color}`} />
        <div className="flex justify-between items-start z-10 relative">
            <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">{title}</p>
                <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
                {sub && <p className={`text-xs mt-2 font-medium ${color.replace('bg-', 'text-')}`}>{sub}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-15`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

export default RepPerformance;
