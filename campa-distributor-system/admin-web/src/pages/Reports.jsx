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
        <div className="animate-fade-in-up space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Reports</h1>
                    <p className="text-slate-500 mt-1">Generate and download financial summaries</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-6 h-fit">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-700 block mb-2">Report Type</label>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setReportType('bills')}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${reportType === 'bills'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                    : 'border-slate-50 hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <ShoppingCart size={20} />
                                <span className="font-semibold">Bill Wise Sales</span>
                            </button>
                            <button
                                onClick={() => setReportType('collections')}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${reportType === 'collections'
                                    ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm'
                                    : 'border-slate-50 hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <CreditCard size={20} />
                                <span className="font-semibold">Collection EntryWise</span>
                            </button>
                            <button
                                onClick={() => setReportType('stock_history')}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${reportType === 'stock_history'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                    : 'border-slate-50 hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <History size={20} />
                                <span className="font-semibold">Stock History</span>
                            </button>
                            <button
                                onClick={() => setReportType('current_stock')}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${reportType === 'current_stock'
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                                    : 'border-slate-50 hover:bg-slate-50 text-slate-600'
                                    }`}
                            >
                                <Box size={20} />
                                <span className="font-semibold">Current Available Stock</span>
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
                <div className="lg:col-span-3 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold mb-6">
                        <Filter size={20} className="text-blue-500" /> Report Filters
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {reportType !== 'current_stock' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                        <Calendar size={16} /> Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                        <Calendar size={16} /> End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
                                    <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                        <Filter size={16} /> Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="status"
                                            value={filters.status}
                                            onChange={handleFilterChange}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                                        >
                                            <option value="">All Active Bills</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled Only</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                        <ChevronDown size={18} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {reportType === 'stock_history' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                            <Package size={16} /> Select Product
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="productId"
                                                value={filters.productId}
                                                onChange={handleFilterChange}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                                            >
                                                <option value="">All Products</option>
                                                {productsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                            <Layers size={16} /> Adjustment Type
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="type"
                                                value={filters.type}
                                                onChange={handleFilterChange}
                                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                                            >
                                                <option value="All">All Adjustments</option>
                                                <option value="Addition">Stock Addition</option>
                                                <option value="Reduction">Stock Reduction</option>
                                            </select>
                                            <ChevronDown size={18} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {reportType === 'bills' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                                        <Hash size={16} /> Order ID / Bill No Range
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            name="startBillNo"
                                            placeholder="From Bill No"
                                            value={filters.startBillNo}
                                            onChange={handleFilterChange}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                        <input
                                            type="text"
                                            name="endBillNo"
                                            placeholder="To Bill No"
                                            value={filters.endBillNo}
                                            onChange={handleFilterChange}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex gap-4 text-sm text-slate-500">
                            <div className="w-1 h-auto bg-blue-500 rounded-full"></div>
                            <p>
                                <strong>Tip:</strong> Leave "From" and "To" blank to include all records within the selected date range.
                                The Bill report combines regular and cancelled invoices based on your status selection.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Preview */}
            {fetchStatus === 'success' && reportData && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <FileText size={20} className="text-blue-500" />
                            Preview Results
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
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
                                        {reportData.invoices.slice(0, 10).map((inv, idx) => (
                                            <tr key={`inv-${idx}`} className="hover:bg-slate-50 transition-colors text-sm">
                                                <td className="px-6 py-4">{inv.order?.billNumber || inv.invoiceNumber}</td>
                                                <td className="px-6 py-4">{inv.invoiceDate}</td>
                                                <td className="px-6 py-4">{inv.order?.retailer?.shopName || 'N/A'}</td>
                                                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs">{inv.order?.status || 'Final'}</span></td>
                                                <td className="px-6 py-4 text-right">Rs. {Number(inv.netTotal).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {reportData.cancelled.slice(0, 10).map((can, idx) => (
                                            <tr key={`can-${idx}`} className="hover:bg-slate-50 transition-colors text-sm">
                                                <td className="px-6 py-4">{can.billNumber || `CAN-${can.id}`}</td>
                                                <td className="px-6 py-4">{new Date(can.originalCreatedAt).toLocaleDateString('en-CA')}</td>
                                                <td className="px-6 py-4">{can.retailer?.shopName || 'N/A'}</td>
                                                <td className="px-6 py-4"><span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs">Cancelled</span></td>
                                                <td className="px-6 py-4 text-right text-red-500">Rs. {Number(can.totalAmount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                                {reportType === 'collections' && reportData.slice(0, 20).map((p, idx) => (
                                    <tr key={`p-${idx}`} className="hover:bg-slate-50 transition-colors text-sm">
                                        <td className="px-6 py-4">{formatDate(p.paymentDate)}</td>
                                        <td className="px-6 py-4">{p.invoice?.order?.billNumber || p.invoice?.invoiceNumber || 'N/A'}</td>
                                        <td className="px-6 py-4">{p.retailerName || 'N/A'}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs">{p.paymentMode}</span></td>
                                        <td className="px-6 py-4 text-right">Rs. {Number(p.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {reportType === 'stock_history' && reportData.slice(0, 20).map((item, idx) => (
                                    <tr key={`sh-${idx}`} className="hover:bg-slate-50 transition-colors text-sm">
                                        <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td className="px-6 py-4">{item.product?.name || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs ${item.type === 'Addition' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{item.user?.name || 'System'}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${item.type === 'Addition' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {item.type === 'Addition' ? '+' : '-'}{item.quantity}
                                        </td>
                                    </tr>
                                ))}
                                {reportType === 'current_stock' && reportData.slice(0, 20).map((p, idx) => (
                                    <tr key={`cs-${idx}`} className="hover:bg-slate-50 transition-colors text-sm">
                                        <td className="px-6 py-4 font-mono text-xs">{p.sku || '—'}</td>
                                        <td className="px-6 py-4 font-bold">{p.name || '—'}</td>
                                        <td className="px-6 py-4 text-slate-500">{p.category || '—'}</td>
                                        <td className="px-6 py-4 text-right font-black text-indigo-600">{p.stock || 0}</td>
                                    </tr>
                                ))}
                                {(reportType === 'bills' ? (reportData.invoices.length + reportData.cancelled.length) : reportData.length) === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                                            No data found for the selected filters.
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
