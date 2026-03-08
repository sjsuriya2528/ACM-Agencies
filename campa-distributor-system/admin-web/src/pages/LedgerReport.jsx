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
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Collection Ledger</h1>
                    </div>
                    <div className="h-1 w-20 bg-indigo-600 rounded mt-2"></div>
                </div>
            </div>

            {/* Controls Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 z-20 relative">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Retailer Multi-Select Box */}
                    <div className="md:col-span-5 relative">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">
                            Select Retailers ({selectedRetailers.length} selected)
                        </label>
                        <div className="relative">
                            <div
                                className="flex items-center justify-between w-full border border-slate-300 rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all bg-slate-50"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <span className={selectedRetailers.length === 0 ? "text-slate-400 font-medium" : "text-slate-800 font-bold"}>
                                    {selectedRetailers.length === 0
                                        ? "Choose Retailers..."
                                        : `${selectedRetailers.length} Retailer(s) Selected`}
                                </span>
                                <div className="text-slate-400">
                                    <Users size={18} />
                                </div>
                            </div>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col pt-2 max-h-80">
                                    <div className="px-3 pb-2 border-b border-slate-100">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input
                                                type="text"
                                                className="w-full text-sm pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                placeholder="Search retailers..."
                                                value={searchRetailer}
                                                onChange={(e) => setSearchRetailer(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={selectAllRetailers} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 bg-indigo-50 rounded-md">Select All</button>
                                            <button onClick={clearRetailers} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1 bg-slate-100 rounded-md">Clear</button>
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                        {filteredRetailerList.map(r => (
                                            <label key={r.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                    checked={selectedRetailers.includes(r.id)}
                                                    onChange={() => toggleRetailer(r.id)}
                                                />
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">{r.shopName}</div>
                                                    <div className="text-xs font-medium text-slate-500">{r.ownerName || 'No owner'}</div>
                                                </div>
                                            </label>
                                        ))}
                                        {filteredRetailerList.length === 0 && (
                                            <div className="p-4 text-center text-sm text-slate-500 italic">No retailers found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date Pickers */}
                    <div className="md:col-span-5 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/[0.2] focus:border-indigo-500 font-bold text-slate-700 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/[0.2] focus:border-indigo-500 font-bold text-slate-700 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="md:col-span-2 flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || selectedRetailers.length === 0}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Generate"
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
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold flex items-center gap-2 shadow-sm transition-colors"
                        >
                            <Download size={18} /> Print All
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
                            <div key={data.retailerId} className="page-break bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
                                {/* Report Header row */}
                                <div className="bg-slate-200 px-6 py-3 border-b border-slate-300">
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        NAME :{data.shopName}
                                    </h2>
                                </div>

                                {/* Table Header */}
                                <div className="grid grid-cols-12 bg-slate-100/80 px-4 py-2">
                                    <div className="col-span-1 text-xs font-black text-red-600 uppercase">SNO</div>
                                    <div className="col-span-2 text-xs font-black text-red-600 uppercase">BILLDATE</div>
                                    <div className="col-span-2 text-xs font-black text-red-600 uppercase">BILLNO</div>
                                    <div className="col-span-3 text-xs font-black text-red-600 uppercase">PARTICULAR</div>
                                    <div className="col-span-2 text-xs font-black text-red-600 uppercase text-right">DEBIT</div>
                                    <div className="col-span-2 text-xs font-black text-red-600 uppercase text-right pr-2">CREDIT</div>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y divide-slate-100">
                                    {data.ledger.map((row, rowIdx) => (
                                        <div
                                            key={rowIdx}
                                            className={`grid grid-cols-12 px-4 py-2 hover:bg-slate-50 ${row.isOpening ? 'font-bold bg-slate-50' : ''}`}
                                        >
                                            <div className="col-span-1 text-sm text-slate-800 font-bold">{row.sno}</div>
                                            <div className="col-span-2 text-sm text-slate-800 font-bold">
                                                {row.date ? row.date.split('-').reverse().join('/') : ''}
                                            </div>
                                            <div className="col-span-2 text-sm text-slate-800 font-bold">{row.billNo}</div>
                                            <div className="col-span-3 text-sm text-slate-800 font-bold">{row.particular}</div>
                                            <div className="col-span-2 text-sm text-slate-900 font-bold text-right pt-0.5">
                                                {row.debit > 0 ? row.debit.toFixed(2) : '0'}
                                            </div>
                                            <div className="col-span-2 text-sm text-slate-900 font-bold text-right pr-2 pt-0.5">
                                                {row.credit > 0 ? row.credit.toFixed(2) : '0'}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Row */}
                                <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-100/80 border-t border-slate-200 mt-2">
                                    <div className="col-span-8 text-sm font-black text-red-600 uppercase">TOTAL</div>
                                    <div className="col-span-2 text-sm font-black text-red-600 text-right">
                                        {data.totalDebit.toFixed(2)}
                                    </div>
                                    <div className="col-span-2 text-sm font-black text-red-600 text-right pr-2">
                                        {data.totalCredit.toFixed(2)}
                                    </div>
                                </div>

                                {/* Closing Balance Row */}
                                <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-200 border-t-4 border-white mt-1">
                                    <div className="col-span-8 text-sm font-black text-red-600 uppercase">
                                        {data.closingBalance >= 0 ? 'DEBIT' : 'CREDIT'}
                                    </div>
                                    <div className="col-span-4 text-sm font-black text-red-600 text-right pr-2">
                                        {Math.abs(data.closingBalance).toFixed(2)}
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
