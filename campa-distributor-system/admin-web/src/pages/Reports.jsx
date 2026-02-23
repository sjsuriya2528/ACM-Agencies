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
    ShoppingCart
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
        endBillNo: ''
    });
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
            const endpoint = reportType === 'bills' ? '/reports/bills' : '/reports/collections';
            const response = await api.get(endpoint, { params: filters });
            setReportData(response.data);
            setFetchStatus('success');
            console.log('Report Data received:', response.data);
        } catch (error) {
            console.error('Fetch Error:', error);
            setFetchStatus('error');
            alert("Failed to fetch report data");
        }
    };

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

            doc.setFontSize(14);
            doc.text(reportType === 'bills' ? 'Bill Wise Sales Summary' : 'Collection EntryWise Report', 105, 25, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 105, 32, { align: 'center' });
            if (filters.status) doc.text(`Status: ${filters.status}`, 105, 38, { align: 'center' });

            if (reportType === 'bills') {
                const tableData = [];
                // Process Invoices
                data.invoices.forEach(inv => {
                    tableData.push([
                        inv.Order?.billNumber || inv.invoiceNumber,
                        new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
                        inv.Order?.retailer?.shopName || 'N/A',
                        inv.Order?.status || 'Final',
                        `Rs. ${Number(inv.netTotal).toFixed(2)}`
                    ]);
                });

                // Process Cancelled
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

            } else {
                const tableData = data.map(p => [
                    formatDate(p.paymentDate),
                    p.Invoice?.Order?.billNumber || p.Invoice?.invoiceNumber || 'N/A',
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
                    headStyles: { fillColor: [245, 158, 11] }, // Amber for collections
                    alternateRowStyles: { fillColor: [255, 251, 235] },
                });

                const total = data.reduce((sum, item) => sum + Number(item.amount), 0);
                doc.text(`Collection Total: Rs. ${total.toLocaleString()}`, 190, doc.lastAutoTable.finalY + 10, { align: 'right' });
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
                            disabled={isGenerating || !reportData || (reportType === 'bills' ? (reportData.invoices.length === 0 && reportData.cancelled.length === 0) : reportData.length === 0)}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${reportType === 'bills'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
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
                                    <th className="px-6 py-4 font-semibold">Bill No</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Retailer</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {reportType === 'bills' ? (
                                    <>
                                        {reportData.invoices.slice(0, 5).map((inv, idx) => (
                                            <tr key={`inv-${idx}`} className="hover:bg-slate-50 transition-colors text-sm">
                                                <td className="px-6 py-4">{inv.Order?.billNumber || inv.invoiceNumber}</td>
                                                <td className="px-6 py-4">{inv.invoiceDate}</td>
                                                <td className="px-6 py-4">{inv.Order?.retailer?.shopName || 'N/A'}</td>
                                                <td className="px-6 py-4"><span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs">{inv.Order?.status || 'Final'}</span></td>
                                                <td className="px-6 py-4 text-right">Rs. {Number(inv.netTotal).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {reportData.cancelled.slice(0, 5).map((can, idx) => (
                                            <tr key={`can-${idx}`} className="hover:bg-slate-50 transition-colors text-sm">
                                                <td className="px-6 py-4">{can.billNumber || `CAN-${can.id}`}</td>
                                                <td className="px-6 py-4">{new Date(can.originalCreatedAt).toLocaleDateString('en-CA')}</td>
                                                <td className="px-6 py-4">{can.retailer?.shopName || 'N/A'}</td>
                                                <td className="px-6 py-4"><span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs">Cancelled</span></td>
                                                <td className="px-6 py-4 text-right text-red-500">Rs. {Number(can.totalAmount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </>
                                ) : (
                                    reportData.slice(0, 5).map((p, idx) => (
                                        <tr key={`p-${idx}`} className="hover:bg-slate-50 transition-colors text-sm">
                                            <td className="px-6 py-4">{p.Invoice?.Order?.billNumber || p.Invoice?.invoiceNumber || 'N/A'}</td>
                                            <td className="px-6 py-4">{formatDate(p.paymentDate)}</td>
                                            <td className="px-6 py-4">{p.retailerName || 'N/A'}</td>
                                            <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs">{p.paymentMode}</span></td>
                                            <td className="px-6 py-4 text-right">Rs. {Number(p.amount).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
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
