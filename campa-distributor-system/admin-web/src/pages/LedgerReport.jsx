import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, Calendar, Search, Users } from 'lucide-react';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const LedgerReport = () => {
    const [loading, setLoading] = useState(false);
    const [retailers, setRetailers] = useState([]);
    const [selectedRetailers, setSelectedRetailers] = useState([]);
    const [searchRetailer, setSearchRetailer] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Default to current month
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const [ledgerData, setLedgerData] = useState([]);

    useEffect(() => {
        const fetchRetailers = async () => {
            try {
                // Fetch all active retailers
                const res = await api.get('/retailers?limit=1000');
                setRetailers(res.data.data || []);
            } catch (error) {
                console.error('Failed to fetch retailers for ledger', error);
            }
        };
        fetchRetailers();
    }, []);

    const handleGenerate = async () => {
        if (selectedRetailers.length === 0) {
            alert("Please select at least one retailer.");
            return;
        }
        if (!startDate || !endDate) {
            alert("Please select both start and end dates.");
            return;
        }

        try {
            setLoading(true);
            const res = await api.post('/reports/ledger', {
                retailerIds: selectedRetailers,
                startDate,
                endDate
            });
            setLedgerData(res.data);
        } catch (error) {
            console.error('Failed to generate ledger', error);
            alert("Failed to generate ledger.");
        } finally {
            setLoading(false);
        }
    };

    const toggleRetailer = (id) => {
        setSelectedRetailers(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const selectAllRetailers = () => {
        setSelectedRetailers(retailers.map(r => r.id));
    };
    const clearRetailers = () => {
        setSelectedRetailers([]);
    };

    const filteredRetailerList = retailers.filter(r =>
        r.shopName.toLowerCase().includes(searchRetailer.toLowerCase()) ||
        (r.ownerName && r.ownerName.toLowerCase().includes(searchRetailer.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="relative">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center transition-colors">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Collection Ledger</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Retailer Wise Payment History</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Panel */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8 z-20 relative transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* Retailer Multi-Select Box */}
                    <div className="md:col-span-5 relative">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block ml-1">
                            Select Retailers ({selectedRetailers.length} selected)
                        </label>
                        <div className="relative">
                            <div
                                className="flex items-center justify-between w-full border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/20 transition-all bg-slate-50 dark:bg-slate-800"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <span className={selectedRetailers.length === 0 ? "text-slate-400 dark:text-slate-500 font-medium" : "text-slate-800 dark:text-slate-100 font-bold"}>
                                    {selectedRetailers.length === 0
                                        ? "Choose Retailers..."
                                        : `${selectedRetailers.length} Retailer(s) Selected`}
                                </span>
                                <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    <Users size={18} />
                                </div>
                            </div>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col pt-3 max-h-80 animate-fade-in ring-1 ring-black/5 dark:ring-white/5">
                                    <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
                                            <input
                                                type="text"
                                                className="w-full text-sm pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 text-slate-700 dark:text-slate-200"
                                                placeholder="Search retailers..."
                                                value={searchRetailer}
                                                onChange={(e) => setSearchRetailer(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={selectAllRetailers} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 transition-all">Select All</button>
                                            <button onClick={clearRetailers} className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 transition-all">Clear</button>
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                        {filteredRetailerList.map(r => (
                                            <label key={r.id} className="flex items-center gap-3 p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-xl cursor-pointer transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-indigo-600 dark:text-indigo-500 rounded-lg border-slate-300 dark:border-slate-700 focus:ring-indigo-500 bg-white dark:bg-slate-800 transition-all"
                                                    checked={selectedRetailers.includes(r.id)}
                                                    onChange={() => toggleRetailer(r.id)}
                                                />
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{r.shopName}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{r.ownerName || 'No owner'}</div>
                                                </div>
                                            </label>
                                        ))}
                                        {filteredRetailerList.length === 0 && (
                                            <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500 italic">No retailers found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date Pickers */}
                    <div className="md:col-span-5 flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block ml-1">Start Date</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 font-black text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block ml-1">End Date</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 font-black text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="md:col-span-2 flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || selectedRetailers.length === 0}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 transform hover:-translate-y-0.5 ${loading || selectedRetailers.length === 0 ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Generate <Download size={16} /></>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* Results Grid / Print Pages */}
            {ledgerData.length > 0 && (
                <div className="space-y-12">
                    {/* Global Actions */}
                    <div className="flex justify-end gap-3 print:hidden">
                        <button
                            onClick={() => window.print()}
                            className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-sm transition-all active:scale-95"
                        >
                            <Download size={18} /> Print All Reports
                        </button>
                    </div>

                    <div className="print-container">
                        <style>
                            {`
                                @media print {
                                    body * { visibility: hidden; }
                                    .print-container, .print-container * { visibility: visible; }
                                    .print-container { position: absolute; left: 0; top: 0; width: 100%; }
                                    .page-break { page-break-after: always; padding-bottom: 2rem; }
                                    .page-break:last-child { page-break-after: auto; }
                                    .print\\:hidden { display: none !important; }
                                }
                            `}
                        </style>

                        {ledgerData.map((data, idx) => (
                            <div key={data.retailerId} className="page-break bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-12 transition-colors">
                                {/* Report Header row */}
                                <div className="bg-slate-100 dark:bg-slate-800 px-8 py-5 border-b border-slate-200 dark:border-slate-800">
                                    <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">
                                        RETAILER : <span className="text-indigo-600 dark:text-indigo-400">{data.shopName}</span>
                                    </h2>
                                </div>

                                {/* Table Header */}
                                <div className="grid grid-cols-12 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="col-span-1 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">S.NO</div>
                                    <div className="col-span-2 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">BILL DATE</div>
                                    <div className="col-span-2 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">BILL NO</div>
                                    <div className="col-span-3 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">PARTICULAR</div>
                                    <div className="col-span-2 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest text-right">DEBIT (₹)</div>
                                    <div className="col-span-2 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest text-right pr-4">CREDIT (₹)</div>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 transition-colors">
                                    {data.ledger.map((row, rowIdx) => (
                                        <div
                                            key={rowIdx}
                                            className={`grid grid-cols-12 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${row.isOpening ? 'font-black bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                                        >
                                            <div className="col-span-1 text-sm text-slate-400 dark:text-slate-500 font-bold">{row.sno}</div>
                                            <div className="col-span-2 text-sm text-slate-800 dark:text-slate-200 font-bold tabular-nums">
                                                {row.date ? row.date.split('-').reverse().join('/') : ''}
                                            </div>
                                            <div className="col-span-2 text-sm text-slate-900 dark:text-slate-100 font-black tracking-tight">{row.billNo}</div>
                                            <div className="col-span-3 text-sm text-slate-500 dark:text-slate-400 font-medium">{row.particular}</div>
                                            <div className="col-span-2 text-sm text-slate-900 dark:text-slate-100 font-black text-right tabular-nums">
                                                {row.debit > 0 ? row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                                            </div>
                                            <div className="col-span-2 text-sm text-slate-900 dark:text-slate-100 font-black text-right pr-4 tabular-nums">
                                                {row.credit > 0 ? row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Row */}
                                <div className="grid grid-cols-12 px-6 py-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700">
                                    <div className="col-span-8 text-xs font-black text-rose-600 dark:text-rose-400 tracking-[0.2em]">TOTAL ACCUMULATED</div>
                                    <div className="col-span-2 text-sm font-black text-rose-600 dark:text-rose-400 text-right tabular-nums">
                                        ₹{data.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="col-span-2 text-sm font-black text-rose-600 dark:text-rose-400 text-right pr-4 tabular-nums">
                                        ₹{data.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>

                                {/* Closing Balance Row */}
                                <div className="grid grid-cols-12 px-6 py-6 bg-slate-100 dark:bg-slate-800 border-t-4 border-white dark:border-slate-900">
                                    <div className="col-span-8 flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${data.closingBalance >= 0 ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                                            <FileText size={16} />
                                        </div>
                                        <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">
                                            CLOSING {data.closingBalance >= 0 ? 'DEBIT' : 'CREDIT'} BALANCE
                                        </div>
                                    </div>
                                    <div className="col-span-4 text-2xl font-black text-rose-600 dark:text-rose-400 text-right pr-4 tabular-nums">
                                        ₹{Math.abs(data.closingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LedgerReport;
