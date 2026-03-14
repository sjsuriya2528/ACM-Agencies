import React, { useState } from 'react';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FileText,
    Download,
    Calendar,
    Filter,
    Hash,
    ChevronDown,
    CreditCard,
    ShoppingCart,
    History,
    Box,
    Layers,
    Package
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
    const [reportType, setReportType] = useState('bills'); // 'bills' or 'collections'
    const [filters, setFilters] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: '',
        startId: '',
        endId: '',
        startBillNo: '',
        endBillNo: '',
        productId: '',
        type: 'All'
    });
    const [productsList, setProductsList] = useState([]); // For the product selector
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [fetchStatus, setFetchStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const raw = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const [y, m, d] = raw.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const fetchReportData = async () => {
        setFetchStatus('loading');
        setReportData(null);
        try {
            let endpoint = '';
            let params = { ...filters };

            if (reportType === 'bills') endpoint = '/reports/bills';
            else if (reportType === 'collections') endpoint = '/reports/collections';
            else if (reportType === 'stock_history') {
                endpoint = '/products/stock-adjustments/history';
                params = {
                    page: 1,
                    limit: 1000,
                    type: filters.type === 'All' ? undefined : filters.type,
                    productId: filters.productId || undefined,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined
                };
            }
            else if (reportType === 'current_stock') {
                endpoint = '/products';
                params = { limit: 500 };
            }

            const response = await api.get(endpoint, { params });

            if (reportType === 'current_stock') {
                const rawProducts = response.data.products || response.data || [];
                const mapped = rawProducts.map(p => ({
                    ...p,
                    stock: p.stockQuantity,
                    category: p.groupName || p.category
                }));
                setReportData(mapped);
            } else if (reportType === 'stock_history') {
                setReportData(response.data.data || []);
            } else {
                setReportData(response.data);
            }

            setFetchStatus('success');
        } catch (error) {
            console.error('Fetch Error:', error);
            setFetchStatus('error');
            alert("Failed to fetch report data");
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products?limit=500');
            setProductsList(res.data.products || res.data || []);
        } catch (err) { console.error(err); }
    };

    React.useEffect(() => {
        fetchProducts();
    }, []);

    const generatePDF = async () => {
        if (!reportData) return;
        setIsGenerating(true);
        try {
            const data = reportData;
            const doc = new jsPDF();
            const timestamp = Date.now();
            const fileName = `${reportType === 'bills' ? 'Bill_Wise_Sales' : 'Collection_Report'}_${filters.startDate}_to_${filters.endDate}_${timestamp}.pdf`;

            // PDF Header
            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.text('ACM AGENCIES', 105, 15, { align: 'center' });

            let subTitle = '';
            if (reportType === 'bills') subTitle = 'Bill Wise Sales Summary';
            else if (reportType === 'collections') subTitle = 'Collection EntryWise Report';
            else if (reportType === 'stock_history') subTitle = 'Stock Adjustment History';
            else if (reportType === 'current_stock') subTitle = 'Current Available Stock levels';

            doc.setFontSize(14);
            doc.text(subTitle, 105, 25, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            if (reportType !== 'current_stock') {
                doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 105, 32, { align: 'center' });
            } else {
                doc.text(`Total Products: ${data.length}`, 105, 32, { align: 'center' });
            }

            if (filters.status && reportType === 'bills') doc.text(`Status: ${filters.status}`, 105, 38, { align: 'center' });
            if (filters.productId && reportType === 'stock_history') {
                const prod = productsList.find(p => p.id == filters.productId);
                if (prod) doc.text(`Product: ${prod.name}`, 105, 38, { align: 'center' });
            }

            if (reportType === 'bills') {
                const tableData = [];
                data.invoices.forEach(inv => {
                    tableData.push([
                        inv.order?.billNumber || inv.invoiceNumber,
                        new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
                        inv.order?.retailer?.shopName || 'N/A',
                        inv.order?.status || 'Final',
                        `Rs. ${Number(inv.netTotal).toFixed(2)}`
                    ]);
                });
                data.cancelled.forEach(can => {
                    tableData.push([
                        can.billNumber || `CAN-${can.id}`,
                        new Date(can.originalCreatedAt).toLocaleDateString('en-IN'),
                        can.retailer?.shopName || 'N/A',
                        'Cancelled',
                        `Rs. ${Number(can.totalAmount).toFixed(2)}`
                    ]);
                });

                autoTable(doc, {
                    startY: 45,
                    head: [['Bill No', 'Date', 'Retailer', 'Status', 'Amount']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [51, 65, 85] },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                });

                const total = [...data.invoices, ...data.cancelled].reduce((sum, item) => sum + Number(item.netTotal || item.totalAmount || 0), 0);
                doc.text(`Summary Total: Rs. ${total.toLocaleString()}`, 190, doc.lastAutoTable.finalY + 10, { align: 'right' });

            } else if (reportType === 'collections') {
                const tableData = data.map(p => [
                    formatDate(p.paymentDate),
                    p.invoice?.order?.billNumber || p.invoice?.invoiceNumber || 'N/A',
                    p.retailerName || 'N/A',
                    p.paymentMode,
                    p.collectedBy?.name || 'Admin',
                    `Rs. ${Number(p.amount).toFixed(2)}`
                ]);

                autoTable(doc, {
                    startY: 45,
                    head: [['Date', 'Bill No', 'Retailer', 'Mode', 'Collected By', 'Amount']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [245, 158, 11] },
                    alternateRowStyles: { fillColor: [255, 251, 235] },
                });

                const total = data.reduce((sum, item) => sum + Number(item.amount), 0);
                doc.text(`Collection Total: Rs. ${total.toLocaleString()}`, 190, doc.lastAutoTable.finalY + 10, { align: 'right' });
            } else if (reportType === 'stock_history') {
                const tableData = data.map(item => [
                    new Date(item.createdAt).toLocaleDateString('en-IN'),
                    item.product?.name || '—',
                    item.type || '—',
                    item.quantity,
                    item.user?.name || 'System',
                    item.remarks || '—'
                ]);

                autoTable(doc, {
                    startY: 45,
                    head: [['Date', 'Product', 'Type', 'Qty', 'User', 'Remarks']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [37, 99, 235] },
                });
            } else if (reportType === 'current_stock') {
                const tableData = data.map(p => [
                    p.sku || '—',
                    p.name || '—',
                    p.category || '—',
                    p.stock || '0'
                ]);

                autoTable(doc, {
                    startY: 45,
                    head: [['SKU', 'Product Name', 'Category', 'Stock']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [79, 70, 229] },
                });
            }

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
            }

            doc.save(fileName);
        } catch (error) {
            console.error(error);
            alert("Failed to generate report");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen animate-fade-in-up space-y-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/30">
                        <FileText size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Analytics</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mt-1 ml-1">Business Intelligence Reports</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 bg-white/80 dark:bg-slate-950/50 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white/60 dark:border-white/5 flex flex-col gap-8 h-fit">
                    <div className="space-y-6">
                        <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest ml-1">Report Module</label>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setReportType('bills')}
                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${reportType === 'bills'
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                                    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <ShoppingCart size={20} className={reportType === 'bills' ? 'text-white' : 'text-blue-500'} />
                                <span className={`text-sm tracking-tight ${reportType === 'bills' ? 'font-black' : 'font-bold'}`}>Bill Wise Sales</span>
                            </button>
                            <button
                                onClick={() => setReportType('collections')}
                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${reportType === 'collections'
                                    ? 'bg-amber-500 border-amber-500 text-white shadow-xl shadow-amber-500/30'
                                    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <CreditCard size={20} className={reportType === 'collections' ? 'text-white' : 'text-amber-500'} />
                                <span className={`text-sm tracking-tight ${reportType === 'collections' ? 'font-black' : 'font-bold'}`}>Collection Summary</span>
                            </button>
                            <button
                                onClick={() => setReportType('stock_history')}
                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${reportType === 'stock_history'
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-500/30'
                                    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <History size={20} className={reportType === 'stock_history' ? 'text-white' : 'text-emerald-500'} />
                                <span className={`text-sm tracking-tight ${reportType === 'stock_history' ? 'font-black' : 'font-bold'}`}>Stock History</span>
                            </button>
                            <button
                                onClick={() => setReportType('current_stock')}
                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${reportType === 'current_stock'
                                    ? 'bg-violet-600 border-violet-600 text-white shadow-xl shadow-violet-500/30'
                                    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Box size={20} className={reportType === 'current_stock' ? 'text-white' : 'text-violet-500'} />
                                <span className={`text-sm tracking-tight ${reportType === 'current_stock' ? 'font-black' : 'font-bold'}`}>Live Inventory</span>
                            </button>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <button
                            onClick={fetchReportData}
                            disabled={fetchStatus === 'loading'}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                        >
                            {fetchStatus === 'loading' ? <LoadingSpinner size="sm" /> : <Filter size={20} />}
                            Generate Preview
                        </button>

                        <button
                            onClick={generatePDF}
                            disabled={isGenerating || !reportData || (
                                reportType === 'bills' ? (reportData.invoices.length === 0 && reportData.cancelled.length === 0) :
                                    reportData.length === 0
                            )}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${reportType === 'bills' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' :
                                reportType === 'collections' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200' :
                                    reportType === 'stock_history' ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' :
                                        'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                } disabled:opacity-50`}
                        >
                            {isGenerating ? <LoadingSpinner size="sm" /> : <Download size={20} />}
                            Download PDF
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                <div className="lg:col-span-3 bg-white/80 dark:bg-slate-950/50 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white/60 dark:border-white/5">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black uppercase tracking-widest mb-8">
                        <Filter size={20} className="text-blue-600" /> Report Filters
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {reportType !== 'current_stock' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                                        <Calendar size={14} className="text-blue-600 dark:text-blue-400" /> Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                        className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 dark:text-white transition-all appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                                        <Calendar size={14} className="text-blue-600 dark:text-blue-400" /> End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                        className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 dark:text-white transition-all appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                        {reportType === 'current_stock' && (
                            <div className="space-y-6 flex items-center justify-center">
                                <div className="text-center p-8 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <Box size={40} className="text-indigo-500 mx-auto mb-3" />
                                    <p className="text-indigo-900 font-bold">Live Inventory Report</p>
                                    <p className="text-indigo-600 text-sm">No date filters required. This will generate a report of all products currently in stock.</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {reportType === 'bills' && (
                                <div>
                                    <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                                        <Filter size={14} className="text-blue-600 dark:text-blue-400" /> Status
                                    </label>
                                    <div className="relative group">
                                        <select
                                            name="status"
                                            value={filters.status}
                                            onChange={handleFilterChange}
                                            className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 dark:text-white transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" className="bg-white dark:bg-slate-900">All Active Bills</option>
                                            <option value="Approved" className="bg-white dark:bg-slate-900">Approved</option>
                                            <option value="Delivered" className="bg-white dark:bg-slate-900">Delivered</option>
                                            <option value="Cancelled" className="bg-white dark:bg-slate-900">Cancelled Only</option>
                                            <option value="Rejected" className="bg-white dark:bg-slate-900">Rejected</option>
                                        </select>
                                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 pointer-events-none transition-colors" />
                                    </div>
                                </div>
                            )}

                            {reportType === 'stock_history' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                                            <Package size={14} className="text-blue-600 dark:text-blue-400" /> Select Product
                                        </label>
                                        <div className="relative group">
                                            <select
                                                name="productId"
                                                value={filters.productId}
                                                onChange={handleFilterChange}
                                                className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 dark:text-white transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="" className="bg-white dark:bg-slate-900">All Products</option>
                                                {productsList.map(p => <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">{p.name}</option>)}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 pointer-events-none transition-colors" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                                            <Layers size={14} className="text-blue-600 dark:text-blue-400" /> Adjustment Type
                                        </label>
                                        <div className="relative group">
                                            <select
                                                name="type"
                                                value={filters.type}
                                                onChange={handleFilterChange}
                                                className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 dark:text-white transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="All" className="bg-white dark:bg-slate-900">All Adjustments</option>
                                                <option value="Addition" className="bg-white dark:bg-slate-900">Stock Addition</option>
                                                <option value="Reduction" className="bg-white dark:bg-slate-900">Stock Reduction</option>
                                            </select>
                                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 pointer-events-none transition-colors" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {reportType === 'bills' && (
                                <div>
                                    <label className="block text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2">
                                        <Hash size={14} className="text-blue-600 dark:text-blue-400" /> Order ID / Bill No Range
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            name="startBillNo"
                                            placeholder="From Bill No"
                                            value={filters.startBillNo}
                                            onChange={handleFilterChange}
                                            className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        />
                                        <input
                                            type="text"
                                            name="endBillNo"
                                            placeholder="To Bill No"
                                            value={filters.endBillNo}
                                            onChange={handleFilterChange}
                                            className="w-full px-4 py-3.5 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 dark:text-white transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-10 p-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-[2rem]">
                        <div className="flex gap-4 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            <div className="w-1.5 h-auto bg-blue-600 rounded-full"></div>
                            <p className="leading-relaxed">
                                Tip: Leave "From" and "To" blank to include all records within the selected date range.
                                The Bill report combines regular and cancelled invoices based on your selection.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Preview */}
            {fetchStatus === 'success' && reportData && (
                <div className="bg-white/80 dark:bg-slate-950/50 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-white/60 dark:border-white/5 overflow-hidden animate-scale-in">
                    <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                            <FileText size={20} className="text-blue-600" />
                            Preview Results
                            <span className="ml-3 px-3 py-1.5 bg-blue-600/10 text-blue-600 text-[10px] rounded-full">
                                {reportType === 'bills' ? (reportData.invoices.length + reportData.cancelled.length) : reportData.length} Records Found
                            </span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <tr>
                                    {reportType === 'bills' && (
                                        <>
                                            <th className="px-6 py-4 font-semibold">Bill No</th>
                                            <th className="px-6 py-4 font-semibold">Date</th>
                                            <th className="px-6 py-4 font-semibold">Retailer</th>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                            <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                        </>
                                    )}
                                    {reportType === 'collections' && (
                                        <>
                                            <th className="px-6 py-4 font-semibold">Date</th>
                                            <th className="px-6 py-4 font-semibold">Bill No</th>
                                            <th className="px-6 py-4 font-semibold">Retailer</th>
                                            <th className="px-6 py-4 font-semibold">Mode</th>
                                            <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                        </>
                                    )}
                                    {reportType === 'stock_history' && (
                                        <>
                                            <th className="px-6 py-4 font-semibold">Date</th>
                                            <th className="px-6 py-4 font-semibold">Product</th>
                                            <th className="px-6 py-4 font-semibold">Type</th>
                                            <th className="px-6 py-4 font-semibold">User</th>
                                            <th className="px-6 py-4 font-semibold text-right">Qty</th>
                                        </>
                                    )}
                                    {reportType === 'current_stock' && (
                                        <>
                                            <th className="px-6 py-4 font-semibold">SKU</th>
                                            <th className="px-6 py-4 font-semibold">Product</th>
                                            <th className="px-6 py-4 font-semibold">Category</th>
                                            <th className="px-6 py-4 font-semibold text-right">Stock</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {reportType === 'bills' && (
                                    <>
                                        {reportData.invoices.slice(0, 50).map((inv, idx) => (
                                            <tr key={`inv-${idx}`} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                                <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white tracking-tighter">{inv.order?.billNumber || inv.invoiceNumber}</td>
                                                <td className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums">{inv.invoiceDate}</td>
                                                <td className="px-8 py-5 text-sm font-bold text-slate-800 dark:text-slate-200">{inv.order?.retailer?.shopName || 'N/A'}</td>
                                                <td className="px-8 py-5">
                                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                        {inv.order?.status || 'Final'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                                    ₹{Number(inv.netTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                        {reportData.cancelled.slice(0, 50).map((can, idx) => (
                                            <tr key={`can-${idx}`} className="group hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors">
                                                <td className="px-8 py-5 text-sm font-black text-rose-600 dark:text-rose-400 tracking-tighter">{can.billNumber || `CAN-${can.id}`}</td>
                                                <td className="px-8 py-5 text-sm font-bold text-slate-400 dark:text-slate-500 tabular-nums">{new Date(can.originalCreatedAt).toLocaleDateString('en-CA')}</td>
                                                <td className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 strike-through opacity-60">{can.retailer?.shopName || 'N/A'}</td>
                                                <td className="px-8 py-5">
                                                    <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                                                        Cancelled
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right text-sm font-black text-rose-500 tabular-nums">
                                                    ₹{Number(can.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                                {reportType === 'collections' && reportData.slice(0, 50).map((p, idx) => (
                                    <tr key={`p-${idx}`} className="group hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors">
                                        <td className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums">{formatDate(p.paymentDate)}</td>
                                        <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white tracking-tighter">{p.invoice?.order?.billNumber || p.invoice?.invoiceNumber || 'N/A'}</td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-800 dark:text-slate-200">{p.retailerName || 'N/A'}</td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                                {p.paymentMode}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right text-sm font-black text-emerald-600 tabular-nums">
                                            ₹{Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {reportType === 'stock_history' && reportData.slice(0, 50).map((item, idx) => (
                                    <tr key={`sh-${idx}`} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                        <td className="px-8 py-5 text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums">{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">{item.product?.name || '—'}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${item.type === 'Addition' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">{item.user?.name || 'System'}</td>
                                        <td className={`px-8 py-5 text-right text-sm font-black tabular-nums ${item.type === 'Addition' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {item.type === 'Addition' ? '+' : '-'}{item.quantity}
                                        </td>
                                    </tr>
                                ))}
                                {reportType === 'current_stock' && reportData.slice(0, 50).map((p, idx) => (
                                    <tr key={`cs-${idx}`} className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors">
                                        <td className="px-8 py-5 font-mono text-xs text-indigo-500">{p.sku || '—'}</td>
                                        <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">{p.name || '—'}</td>
                                        <td className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{p.category || '—'}</td>
                                        <td className="px-8 py-5 text-right font-black text-lg text-indigo-600 dark:text-indigo-400 tabular-nums">{p.stock || 0}</td>
                                    </tr>
                                ))}
                                {(reportType === 'bills' ? (reportData.invoices.length + reportData.cancelled.length) : reportData.length) === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[1.5rem] flex items-center justify-center mb-6 text-slate-300 dark:text-white/10">
                                                    <FileText size={40} />
                                                </div>
                                                <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">No results found</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">Adjust your filters and try again</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
