import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, Calendar, Search, Users, ArrowRight, CreditCard } from 'lucide-react';
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
        <div className="p-6 max-w-7xl mx-auto min-h-screen animate-fade-in-up space-y-10">
            {/* Header section with glassmorphism */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                        <FileText size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Collection Ledger</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mt-1 ml-1">Retailer Wise Payment History</p>
                    </div>
                </div>
            </header>

            {/* Controls Panel with Glassmorphism */}
            <div className="bg-white/80 dark:bg-slate-950/50 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/60 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-12">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

                    {/* Retailer Multi-Select Box */}
                    <div className="md:col-span-5 relative">
                        <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 block ml-1">
                            Retailer Selection ({selectedRetailers.length} active)
                        </label>
                        <div className="relative">
                            <div
                                className="flex items-center justify-between w-full border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all bg-slate-50/50 dark:bg-slate-900 group"
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

                            {/* Dropdown Menu - Glassmorphism */}
                            {dropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-white/60 dark:border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] rounded-3xl z-50 overflow-hidden flex flex-col pt-4 max-h-96 animate-scale-in">
                                    <div className="px-6 pb-4 border-b border-slate-100 dark:border-white/5">
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                            <input
                                                type="text"
                                                className="w-full text-sm pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-slate-700 dark:text-slate-200 font-bold"
                                                placeholder="Search retailers..."
                                                value={searchRetailer}
                                                onChange={(e) => setSearchRetailer(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button onClick={selectAllRetailers} className="flex-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-500/30 transition-all active:scale-95">Select All</button>
                                            <button onClick={clearRetailers} className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-white/10 transition-all active:scale-95">Clear</button>
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-3 space-y-1">
                                        {filteredRetailerList.map(r => (
                                            <label key={r.id} className="flex items-center gap-4 p-4 hover:bg-indigo-600/10 dark:hover:bg-indigo-500/10 rounded-2xl cursor-pointer transition-all group active:scale-[0.98]">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-indigo-600 dark:text-indigo-500 rounded-lg border-slate-300 dark:border-white/10 focus:ring-indigo-500 bg-white dark:bg-slate-900 transition-all"
                                                    checked={selectedRetailers.includes(r.id)}
                                                    onChange={() => toggleRetailer(r.id)}
                                                />
                                                <div className="flex-1">
                                                    <div className={`text-sm tracking-tight transition-colors ${selectedRetailers.includes(r.id) ? 'font-black text-indigo-600 dark:text-indigo-400' : 'font-bold text-slate-700 dark:text-slate-300'}`}>{r.shopName}</div>
                                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{r.ownerName || 'NO OWNER'}</div>
                                                </div>
                                            </label>
                                        ))}
                                        {filteredRetailerList.length === 0 && (
                                            <div className="p-10 text-center">
                                                <Users size={32} className="mx-auto text-slate-200 dark:text-white/5 mb-3" />
                                                <p className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">No retailers found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date Pickers */}
                    <div className="md:col-span-5 flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 block ml-1">Period Start</label>
                            <div className="relative group">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 block ml-1">Period End</label>
                            <div className="relative group">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="md:col-span-2 flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || selectedRetailers.length === 0}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 transform hover:-translate-y-1 ${loading || selectedRetailers.length === 0 ? 'bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Generate <ArrowRight size={18} /></>
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

                    <div className="print-container space-y-16">
                        <style>
                            {`
                                @media print {
                                    @page { margin: 15mm; }
                                    body * { visibility: hidden; background: white !important; }
                                    .print-container, .print-container * { visibility: visible; }
                                    .print-container { position: absolute; left: 0; top: 0; width: 100%; }
                                    .page-break { page-break-after: always; padding-bottom: 2rem; border:none !important; box-shadow:none !important; }
                                    .page-break:last-child { page-break-after: auto; }
                                    .print\\:hidden { display: none !important; }
                                    .glass-effect { backdrop-filter: none !important; background: white !important; border: 1px solid #eee !important; }
                                }
                            `}
                        </style>

                        {ledgerData.map((data, idx) => (
                            <div key={data.retailerId} className="page-break bg-white/80 dark:bg-slate-950/50 backdrop-blur-2xl border border-white/60 dark:border-white/5 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden mb-16 animate-scale-in">
                                {/* Report Header row */}
                                <div className="bg-slate-50/50 dark:bg-slate-900/50 px-10 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            RETAILER : <span className="text-indigo-600 dark:text-indigo-400">{data.shopName}</span>
                                        </h2>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] print:hidden">
                                        Collection Summary
                                    </div>
                                </div>

                                {/* Table Header */}
                                <div className="grid grid-cols-12 bg-slate-50/30 dark:bg-white/[0.02] px-10 py-5 border-b border-slate-100 dark:border-white/5">
                                    <div className="col-span-1 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">S.NO</div>
                                    <div className="col-span-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">BILL DATE</div>
                                    <div className="col-span-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">BILL NO</div>
                                    <div className="col-span-3 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">PARTICULAR</div>
                                    <div className="col-span-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest text-right">COLLECTION</div>
                                    <div className="col-span-2 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest text-right">BALANCE</div>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900 transition-colors">
                                    {data.ledger.map((row, rowIdx) => (
                                        <div
                                            key={rowIdx}
                                            className={`grid grid-cols-12 px-10 py-5 group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all ${row.isOpening ? 'bg-indigo-500/5 dark:bg-indigo-400/5' : ''}`}
                                        >
                                            <div className="col-span-1 text-xs text-slate-400 dark:text-slate-500 font-bold tabular-nums">{row.sno}</div>
                                            <div className="col-span-2 text-sm text-slate-900 dark:text-white font-black tabular-nums tracking-tight">
                                                {row.date ? row.date.split('-').reverse().join('/') : ''}
                                            </div>
                                            <div className="col-span-2 text-sm text-indigo-600 dark:text-indigo-400 font-black tracking-tighter uppercase">{row.billNo}</div>
                                            <div className="col-span-3 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{row.particular}</div>
                                            <div className={`col-span-2 text-sm font-black text-right tabular-nums ${row.debit > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-white/10'}`}>
                                                {row.debit > 0 ? `₹${row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                            </div>
                                            <div className={`col-span-2 text-sm font-black text-right tabular-nums ${row.credit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-white/10'}`}>
                                                {row.credit > 0 ? `₹${row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Row */}
                                <div className="grid grid-cols-12 px-10 py-6 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5">
                                    <div className="col-span-8 text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.3em] uppercase">Total Business Volume</div>
                                    <div className="col-span-2 text-sm font-black text-slate-900 dark:text-white text-right tabular-nums">
                                        ₹{data.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="col-span-2 text-sm font-black text-emerald-600 dark:text-emerald-400 text-right tabular-nums">
                                        ₹{data.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>

                                {/* Closing Balance Row */}
                                <div className="grid grid-cols-12 px-10 py-10 bg-indigo-600 dark:bg-indigo-600 text-white border-t border-indigo-500">
                                    <div className="col-span-8 flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl">
                                            <CreditCard size={32} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">
                                                NET OUTSTANDING BALANCE
                                            </div>
                                            <div className="text-xl font-black uppercase tracking-tight">
                                                {data.closingBalance >= 0 ? 'Account Receivable' : 'Account Payable'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-4 flex flex-col items-end justify-center">
                                        <div className="text-4xl font-black tabular-nums drop-shadow-lg">
                                            ₹{Math.abs(data.closingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                        {data.closingBalance > 0 && (
                                            <div className="mt-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                                                Pending Collection
                                            </div>
                                        )}
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
