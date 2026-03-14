import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, Loader2, Package, Minus, Search, Filter, Calendar, ChevronDown, ChevronUp, RefreshCw, XCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import LoadingSpinner from '../components/LoadingSpinner';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', purchaseCratePrice: '', sellingCratePrice: '', stock: '', category: '', bottlesPerCrate: 24, gstPercentage: 18.00 });
    const [editingId, setEditingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Stock Adjustment (Add/Reduce) State
    const [isStockAdjModalOpen, setIsStockAdjModalOpen] = useState(false);
    const [stockAdjData, setStockAdjData] = useState({ id: null, name: '', currentStock: 0, crates: '', bottles: '', bpc: 24, type: 'Addition', remarks: '' });

    // Stock History State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [stockHistory, setStockHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Tab State
    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'history'

    // Global History State
    const [globalHistory, setGlobalHistory] = useState([]);
    const [globalHistoryLoading, setGlobalHistoryLoading] = useState(false);
    const [historyFilters, setHistoryFilters] = useState({
        productId: '',
        type: 'All',
        startDate: '',
        endDate: ''
    });
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);

    // PDF Generation
    const downloadInventoryPDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["ID", "Name", "Category", "Stock (Btls)", "Price/Crate (P)", "Price/Crate (S)"];
        const tableRows = [];

        products.forEach(p => {
            const bpc = p.bottlesPerCrate || 24;
            const rowData = [
                p.id,
                p.name,
                p.category || '—',
                p.stockQuantity,
                `₹${(p.price * bpc).toFixed(2)}`,
                p.sellingPrice ? `₹${(p.sellingPrice * bpc).toFixed(2)}` : '—'
            ];
            tableRows.push(rowData);
        });

        doc.setFontSize(18);
        doc.text("ACM AGENCIES - Current Inventory Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 30);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const downloadGlobalHistoryPDF = () => {
        const doc = new jsPDF();
        const tableColumn = ["Date", "Product", "Type", "Qty", "User", "Remarks"];
        const tableRows = [];

        globalHistory.forEach(item => {
            const rowData = [
                new Date(item.createdAt).toLocaleDateString('en-IN'),
                item.product?.name || '—',
                item.type,
                item.quantity,
                item.user?.name || '—',
                item.remarks || '—'
            ];
            tableRows.push(rowData);
        });

        doc.setFontSize(18);
        doc.text("ACM AGENCIES - Stock Adjustment History", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);

        let filterText = "Filters: All Records";
        if (historyFilters.type !== 'All' || historyFilters.productId || historyFilters.startDate) {
            filterText = `Filters: ${historyFilters.type !== 'All' ? `Type: ${historyFilters.type}` : ''} ${historyFilters.startDate ? `| From: ${historyFilters.startDate} To: ${historyFilters.endDate}` : ''}`;
        }
        doc.text(filterText, 14, 30);
        doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 36);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`Stock_History_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const downloadProductHistoryPDF = (product, history) => {
        const doc = new jsPDF();
        const tableColumn = ["Date", "Type", "Quantity", "Adjusted By", "Remarks"];
        const tableRows = [];

        history.forEach(item => {
            const rowData = [
                new Date(item.createdAt).toLocaleString('en-IN'),
                item.type,
                item.quantity,
                item.user?.name || '—',
                item.remarks || '—'
            ];
            tableRows.push(rowData);
        });

        doc.setFontSize(18);
        doc.text(`ACM AGENCIES - Stock History: ${product.name}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Current Stock: ${product.stockQuantity} bottles`, 14, 30);
        doc.text(`Report Generated: ${new Date().toLocaleString('en-IN')}`, 14, 36);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [5, 150, 105] }
        });

        doc.save(`${product.name.replace(/\s+/g, '_')}_History.pdf`);
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            const mappedProducts = response.data.map(p => ({
                ...p,
                stock: p.stockQuantity,
                category: p.groupName
            })).sort((a, b) => a.id - b.id);
            setProducts(mappedProducts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchGlobalHistory = async () => {
        setGlobalHistoryLoading(true);
        try {
            const params = {
                page: historyPage,
                limit: 20,
                productId: historyFilters.productId,
                type: historyFilters.type,
                startDate: historyFilters.startDate,
                endDate: historyFilters.endDate
            };
            const response = await api.get('/products/stock-adjustments/history', { params });
            setGlobalHistory(response.data.data);
            setHistoryTotalPages(response.data.totalPages);
        } catch (error) {
            console.error("Failed to fetch global history:", error);
        } finally {
            setGlobalHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchGlobalHistory();
        }
    }, [activeTab, historyPage, historyFilters]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const bpc = parseInt(formData.bottlesPerCrate) || 24;
            const purchasePricePerBottle = (parseFloat(formData.purchaseCratePrice) / bpc).toFixed(4);
            const sellingPricePerBottle = formData.sellingCratePrice
                ? (parseFloat(formData.sellingCratePrice) / bpc).toFixed(4)
                : null;

            const payload = {
                name: formData.name,
                price: purchasePricePerBottle,
                sellingPrice: sellingPricePerBottle,
                stockQuantity: formData.stock,
                groupName: formData.category,
                bottlesPerCrate: bpc,
                gstPercentage: parseFloat(formData.gstPercentage) || 18.00
            };

            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post('/products', payload);
            }
            setIsModalOpen(false);
            setFormData({ name: '', purchaseCratePrice: '', sellingCratePrice: '', stock: '', category: '', bottlesPerCrate: 24, gstPercentage: 18.00 });
            setEditingId(null);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert("Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (product) => {
        const bpc = product.bottlesPerCrate || 24;
        setFormData({
            name: product.name,
            purchaseCratePrice: (product.price * bpc).toFixed(2),
            sellingCratePrice: product.sellingPrice ? (product.sellingPrice * bpc).toFixed(2) : '',
            stock: product.stock,
            crates: (product.stock / bpc).toFixed(1),
            category: product.category,
            bottlesPerCrate: bpc,
            gstPercentage: product.gstPercentage || 18.00
        });
        setEditingId(product.id);
        setIsModalOpen(true);
    };

    const handleStockAdjClick = (product, type = 'Addition') => {
        setStockAdjData({
            id: product.id,
            name: product.name,
            currentStock: product.stock,
            crates: '',
            bottles: '',
            bpc: product.bottlesPerCrate || 24,
            type: type,
            remarks: ''
        });
        setIsStockAdjModalOpen(true);
    };

    const submitStockAdj = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const addedCrates = parseInt(stockAdjData.crates) || 0;
            const addedBottles = parseInt(stockAdjData.bottles) || 0;
            const totalToAdj = (addedCrates * stockAdjData.bpc) + addedBottles;

            if (totalToAdj === 0) {
                alert("Please enter a quantity");
                setIsSubmitting(false);
                return;
            }

            if (stockAdjData.type === 'Reduction' && !stockAdjData.remarks) {
                alert("Remarks are mandatory for stock reduction");
                setIsSubmitting(false);
                return;
            }

            await api.post(`/products/${stockAdjData.id}/adjust-stock`, {
                type: stockAdjData.type,
                quantity: totalToAdj,
                remarks: stockAdjData.remarks || (stockAdjData.type === 'Addition' ? 'Manual Addition' : '')
            });

            setIsStockAdjModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Failed to adjust stock");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchStockHistory = async (product) => {
        setHistoryLoading(true);
        setSelectedProduct(product);
        setIsHistoryModalOpen(true);
        try {
            const response = await api.get(`/products/${product.id}/stock-history`);
            setStockHistory(response.data);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Products</h1>
                    <div className="h-1 w-20 bg-blue-600 rounded mt-1"></div>
                </div>
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-transparent dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
                    >
                        Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
                    >
                        Stock History
                    </button>
                </div>
            </div>

            {activeTab === 'products' && (
                <>
                    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={downloadInventoryPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-100 dark:border-indigo-800/50"
                        >
                            <Download size={18} /> Export Inventory
                        </button>
                    </div>
                    {loading ? <LoadingSpinner /> : (
                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow overflow-x-auto border border-transparent dark:border-slate-800">
                            <table className="w-full divide-y divide-gray-200 dark:divide-slate-800">
                                <thead className="bg-gray-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-2 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-10">ID</th>
                                        <th className="px-2 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                        <th className="px-2 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                            <span className="text-orange-600 dark:text-orange-400">Buy</span>
                                        </th>
                                        <th className="px-2 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                            <span className="text-emerald-600 dark:text-emerald-400">Sell</span>
                                        </th>
                                        <th className="px-2 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Stock</th>
                                        <th className="px-2 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cat.</th>
                                        <th className="px-2 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">GST</th>
                                        <th className="px-2 py-3 text-right text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                                    {(() => {
                                        if (!Array.isArray(products)) {
                                            console.warn("Filter warning: 'products' is not an array in Products.jsx. Type:", typeof products, "Value:", products);
                                        }
                                        return (Array.isArray(products) ? products : []).filter(p =>
                                            (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                                            (p.category && p.category.toLowerCase().includes((searchTerm || '').toLowerCase()))
                                        ).map(product => {
                                            const isSingle = product.name.toUpperCase().includes('SINGLE') || product.name.toUpperCase().includes('BOTTLE');
                                            const bpc = product.bottlesPerCrate || 24;

                                            // Stock is now always stored as Bottles
                                            const bottles = product.stock;
                                            const crates = isSingle ? '-' : Math.ceil(product.stock / bpc);

                                            return (
                                                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                                                    <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-slate-400">{product.id}</td>
                                                    <td className="px-2 py-2 text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight min-w-[100px] break-words">{product.name}</td>
                                                    {/* Purchase Price */}
                                                    <td className="px-2 py-2 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-orange-700 dark:text-orange-400">
                                                                ₹{(product.price * bpc).toFixed(2)} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">/ crt</span>
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                ₹{Number(product.price).toFixed(2)} <span className="text-[10px]">/ btl</span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {/* Selling Price */}
                                                    <td className="px-2 py-2 whitespace-nowrap">
                                                        {product.sellingPrice ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                                                    ₹{(product.sellingPrice * bpc).toFixed(2)} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">/ crt</span>
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                    ₹{Number(product.sellingPrice).toFixed(2)} <span className="text-[10px]">/ btl</span>
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-300 dark:text-slate-600 italic">Not set</span>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap">
                                                        <div className="flex flex-col border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-1 rounded-lg w-fit">
                                                            <span className={`text-[11px] font-bold ${bottles > 100 ? 'text-green-700 dark:text-emerald-400' :
                                                                bottles > 0 ? 'text-yellow-700 dark:text-yellow-400' :
                                                                    'text-red-700 dark:text-rose-400'
                                                                }`}>{bottles} btls</span>
                                                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase">{isSingle ? '—' : `${crates} crt`}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-800/50 block break-words leading-tight shadow-sm max-w-[80px] text-center">
                                                            {product.category || 'Uncat.'}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-center">
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded border border-orange-100 dark:border-orange-800/50 shadow-sm inline-block">
                                                            {product.gstPercentage}%
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-2 text-right">
                                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 w-14 lg:w-[5.5rem] ml-auto">
                                                            <button onClick={() => handleStockAdjClick(product, 'Addition')} className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors flex justify-center items-center shadow-sm" title="Add"><Plus size={14} strokeWidth={2.5} /></button>
                                                            <button onClick={() => handleStockAdjClick(product, 'Reduction')} className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 bg-orange-50 dark:bg-orange-900/30 p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-md transition-colors flex justify-center items-center shadow-sm" title="Reduce"><Minus size={14} strokeWidth={2.5} /></button>
                                                            <button onClick={() => fetchStockHistory(product)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors flex justify-center items-center shadow-sm" title="History"><Package size={14} strokeWidth={2.5} /></button>
                                                            <button onClick={() => startEdit(product)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition-colors flex justify-center items-center shadow-sm" title="Edit"><Edit size={14} strokeWidth={2.5} /></button>
                                                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors flex justify-center items-center shadow-sm col-span-2 lg:col-span-1" title="Delete"><Trash2 size={14} strokeWidth={2.5} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()
                                    }
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'history' && (
                <div className="space-y-6">
                    {/* History Filters */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Product</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all"
                                value={historyFilters.productId}
                                onChange={e => setHistoryFilters({ ...historyFilters, productId: e.target.value })}
                            >
                                <option value="">All Products</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="w-40">
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Type</label>
                            <select
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all"
                                value={historyFilters.type}
                                onChange={e => setHistoryFilters({ ...historyFilters, type: e.target.value })}
                            >
                                <option value="All">All Types</option>
                                <option value="Addition">Addition</option>
                                <option value="Reduction">Reduction</option>
                            </select>
                        </div>
                        <div className="flex gap-2 items-end">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Date Range</label>
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <input
                                        type="date"
                                        className="bg-transparent border-none text-sm p-1.5 outline-none dark:text-slate-200"
                                        value={historyFilters.startDate}
                                        onChange={e => setHistoryFilters({ ...historyFilters, startDate: e.target.value })}
                                    />
                                    <span className="text-slate-300">→</span>
                                    <input
                                        type="date"
                                        className="bg-transparent border-none text-sm p-1.5 outline-none dark:text-slate-200"
                                        value={historyFilters.endDate}
                                        onChange={e => setHistoryFilters({ ...historyFilters, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => setHistoryFilters({ productId: '', type: 'All', startDate: '', endDate: '' })}
                                className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-500 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                                title="Clear Filters"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        <button
                            onClick={downloadGlobalHistoryPDF}
                            disabled={globalHistory.length === 0}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Download size={18} /> Export Report
                        </button>
                        <button
                            onClick={fetchGlobalHistory}
                            className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-blue-900/20 transition-all active:scale-95"
                        >
                            <RefreshCw size={20} className={globalHistoryLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* History Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-x-auto">
                        {globalHistoryLoading ? (
                            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
                        ) : globalHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                                <Package size={48} className="mb-4 opacity-20" />
                                <p>No adjustment records found.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Qty</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {globalHistory.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                            {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.product?.name}</div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500">ID: #{item.productId}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.type === 'Addition' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/30'
                                                            }`}>
                                                            {item.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-sm font-black ${item.type === 'Addition' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                            {item.type === 'Addition' ? '+' : '-'}{item.quantity}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">btls</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                                                {(item.adjustedBy?.name || 'S')[0]}
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.adjustedBy?.name || 'System'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" title={item.remarks}>{item.remarks}</p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                 {historyTotalPages > 1 && (
                                     <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                         <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Page {historyPage} of {historyTotalPages}</span>
                                         <div className="flex gap-2">
                                             <button
                                                 disabled={historyPage === 1}
                                                 onClick={() => setHistoryPage(p => p - 1)}
                                                 className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-slate-200"
                                             >
                                                 <ChevronDown size={18} className="rotate-90" />
                                             </button>
                                             <button
                                                 disabled={historyPage === historyTotalPages}
                                                 onClick={() => setHistoryPage(p => p + 1)}
                                                 className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-slate-200"
                                             >
                                                 <ChevronUp size={18} className="rotate-90" />
                                             </button>
                                         </div>
                                     </div>
                                 )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all my-auto border border-transparent dark:border-slate-800">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    {editingId ? <Edit size={20} /> : <Plus size={20} />}
                                    {editingId ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Product Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                        placeholder="e.g. Campa Cola 200ml"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    {/* Purchase Price */}
                                     <div className="relative">
                                         <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                             Purchase Price / Crate <span className="text-orange-500 dark:text-orange-400 text-xs">(from trader)</span>
                                         </label>
                                         <div className="relative">
                                             <span className="absolute left-3 top-2 text-gray-400 dark:text-slate-500">₹</span>
                                             <input
                                                 type="number" step="0.01"
                                                 className="w-full pl-7 pr-4 py-2 border border-orange-200 dark:border-orange-900/50 bg-orange-50/30 dark:bg-orange-900/10 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all outline-none dark:text-slate-100"
                                                placeholder="0.00"
                                                value={formData.purchaseCratePrice}
                                                onChange={e => setFormData({ ...formData, purchaseCratePrice: e.target.value })}
                                                required
                                            />
                                        </div>
                                         {formData.purchaseCratePrice && formData.bottlesPerCrate && (
                                             <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                                                 ₹{(parseFloat(formData.purchaseCratePrice) / (parseInt(formData.bottlesPerCrate) || 24)).toFixed(4)}/btl
                                             </p>
                                         )}
                                    </div>
                                    {/* Selling Price */}
                                     <div className="relative">
                                         <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                             Selling Price / Crate <span className="text-emerald-500 dark:text-emerald-400 text-xs">(to retailers)</span>
                                         </label>
                                         <div className="relative">
                                             <span className="absolute left-3 top-2 text-gray-400 dark:text-slate-500">₹</span>
                                             <input
                                                 type="number" step="0.01"
                                                 className="w-full pl-7 pr-4 py-2 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all outline-none dark:text-slate-100"
                                                placeholder="0.00"
                                                value={formData.sellingCratePrice}
                                                onChange={e => setFormData({ ...formData, sellingCratePrice: e.target.value })}
                                            />
                                        </div>
                                         {formData.sellingCratePrice && formData.bottlesPerCrate && (
                                             <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                                                 ₹{(parseFloat(formData.sellingCratePrice) / (parseInt(formData.bottlesPerCrate) || 24)).toFixed(4)}/btl
                                             </p>
                                         )}
                                    </div>
                                </div>
                                {/* Bottles per crate + price summary */}
                                <div className="grid grid-cols-2 gap-5 items-start">
                                     <div>
                                         <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bottles per Crate</label>
                                         <input
                                             type="number"
                                             className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                             value={formData.bottlesPerCrate}
                                             onChange={e => setFormData({ ...formData, bottlesPerCrate: e.target.value })}
                                             required
                                         />
                                     </div>
                                     {/* Margin preview */}
                                     {formData.purchaseCratePrice && formData.sellingCratePrice && (
                                         <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-xs">
                                             <p className="font-semibold text-slate-600 dark:text-slate-400 mb-1">Margin / Crate</p>
                                             <p className={`font-bold text-base ${parseFloat(formData.sellingCratePrice) >= parseFloat(formData.purchaseCratePrice)
                                                 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                                 }`}>
                                                 ₹{(parseFloat(formData.sellingCratePrice) - parseFloat(formData.purchaseCratePrice)).toFixed(2)}
                                             </p>
                                             <p className="text-slate-400 dark:text-slate-500">
                                                 {((parseFloat(formData.sellingCratePrice) - parseFloat(formData.purchaseCratePrice)) / parseFloat(formData.purchaseCratePrice) * 100).toFixed(1)}% margin
                                             </p>
                                         </div>
                                     )}
                                </div>



                                 <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                                     <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Initial Stock</h3>
                                    <div className="grid grid-cols-2 gap-5">
                                         <div>
                                             <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Crates</label>
                                             <input
                                                 type="number"
                                                 className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none dark:text-slate-100"
                                                 placeholder="0"
                                                 value={formData.crates || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const bpc = parseInt(formData.bottlesPerCrate) || 24;
                                                    setFormData({
                                                        ...formData,
                                                        crates: val,
                                                        stock: val ? Math.round(val * bpc) : formData.stock
                                                    });
                                                }}
                                            />
                                        </div>
                                         <div>
                                             <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Total Bottles</label>
                                             <input
                                                 type="number"
                                                 className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none dark:text-slate-100"
                                                 placeholder="0"
                                                 value={formData.stock}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const bpc = parseInt(formData.bottlesPerCrate) || 24;
                                                    setFormData({
                                                        ...formData,
                                                        stock: val,
                                                        crates: val ? (val / bpc).toFixed(1) : ''
                                                    });
                                                }}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Category</label>
                                     <input
                                         type="text"
                                         className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                         placeholder="e.g. Soft Drinks"
                                         value={formData.category}
                                         onChange={e => setFormData({ ...formData, category: e.target.value })}
                                     />
                                 </div>

                                 <div className="space-y-2">
                                     <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">GST Percentage (%)</label>
                                     <div className="flex items-center gap-4">
                                         <div className="flex-1 relative">
                                             <input
                                                 type="number"
                                                 step="0.01"
                                                 className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                                                 placeholder="18.00"
                                                 value={formData.gstPercentage}
                                                 onChange={e => setFormData({ ...formData, gstPercentage: e.target.value })}
                                                 required
                                             />
                                             <span className="absolute right-3 top-2 text-gray-400 dark:text-slate-500">%</span>
                                         </div>
                                         <div className="flex gap-3 text-xs">
                                             <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 px-3 py-1.5 rounded-md">
                                                 <span className="text-orange-600 dark:text-orange-400 block font-semibold">CGST</span>
                                                 <span className="text-orange-700 dark:text-orange-300">{(parseFloat(formData.gstPercentage || 0) / 2).toFixed(2)}%</span>
                                             </div>
                                             <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 px-3 py-1.5 rounded-md">
                                                 <span className="text-blue-600 dark:text-blue-400 block font-semibold">SGST</span>
                                                 <span className="text-blue-700 dark:text-blue-300">{(parseFloat(formData.gstPercentage || 0) / 2).toFixed(2)}%</span>
                                             </div>
                                         </div>
                                     </div>
                                     <p className="text-[10px] text-gray-400 dark:text-slate-500 italic">Total GST = CGST + SGST</p>
                                 </div>

                                <div className="flex justify-end gap-3 pt-2">
                                     <button
                                         type="button"
                                         onClick={() => setIsModalOpen(false)}
                                         disabled={isSubmitting}
                                         className="px-5 py-2 text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                     >
                                         Cancel
                                     </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-200 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                {editingId ? <Edit size={18} /> : <Package size={18} />}
                                                <span>{editingId ? 'Save Changes' : 'Create Product'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            {isStockAdjModalOpen && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                     <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-white/20 dark:border-slate-800">
                        <div className={`bg-gradient-to-br ${stockAdjData.type === 'Addition' ? 'from-emerald-500 to-emerald-700' : 'from-orange-500 to-orange-700'} px-6 py-5 flex justify-between items-center relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Package size={80} />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-xl font-bold text-white tracking-tight">Manual Stock {stockAdjData.type}</h2>
                                <p className="text-white/90 text-sm font-medium mt-0.5">{stockAdjData.name}</p>
                            </div>
                            <button onClick={() => setIsStockAdjModalOpen(false)} className="text-white/70 hover:text-white transition-all bg-white/10 p-2 rounded-xl backdrop-blur-sm self-start relative z-10">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={submitStockAdj} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{stockAdjData.type === 'Addition' ? 'Add' : 'Reduce'} Crates</label>
                                     <div className="relative">
                                         <input
                                             type="number"
                                             autoFocus
                                             className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 ${stockAdjData.type === 'Addition' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-orange-500 focus:border-orange-500'} transition-all outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100`}
                                             value={stockAdjData.crates}
                                             onChange={e => setStockAdjData({ ...stockAdjData, crates: e.target.value })}
                                             placeholder="0"
                                         />
                                         <span className="absolute right-2 top-2.5 text-xs text-gray-400 dark:text-slate-500">crts</span>
                                     </div>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{stockAdjData.type === 'Addition' ? 'Add' : 'Reduce'} Bottles</label>
                                     <div className="relative">
                                         <input
                                             type="number"
                                             className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 ${stockAdjData.type === 'Addition' ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-orange-500 focus:border-orange-500'} transition-all outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100`}
                                             value={stockAdjData.bottles}
                                             onChange={e => setStockAdjData({ ...stockAdjData, bottles: e.target.value })}
                                             placeholder="0"
                                         />
                                         <span className="absolute right-2 top-2.5 text-xs text-gray-400 dark:text-slate-500">btls</span>
                                     </div>
                                 </div>
                            </div>

                             <div>
                                 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Remarks {stockAdjData.type === 'Reduction' && <span className="text-red-500">*</span>}</label>
                                 <textarea
                                     className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 ${stockAdjData.type === 'Addition' ? 'focus:ring-emerald-500' : 'focus:ring-orange-500'} transition-all outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600`}
                                     rows="2"
                                     placeholder={stockAdjData.type === 'Addition' ? 'Manual stock addition' : 'Reason for reduction (e.g. Breakage, Return)'}
                                     value={stockAdjData.remarks}
                                     onChange={e => setStockAdjData({ ...stockAdjData, remarks: e.target.value })}
                                     required={stockAdjData.type === 'Reduction'}
                                 />
                             </div>

                             <div className={`rounded-2xl p-5 space-y-3 border-2 shadow-inner transition-all ${stockAdjData.type === 'Addition' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30'}`}>
                                 <div className="flex justify-between items-center text-sm">
                                     <span className="text-slate-500 dark:text-slate-400 font-medium">Current Inventory</span>
                                     <span className="font-bold text-slate-700 dark:text-slate-200">{stockAdjData.currentStock} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal uppercase">btls</span></span>
                                 </div>
                                 <div className={`flex justify-between items-center text-sm ${stockAdjData.type === 'Addition' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                     <span className="font-medium underline decoration-dotted underline-offset-4">{stockAdjData.type === 'Addition' ? 'Adding' : 'Reducing'} Amount</span>
                                     <span className="font-black">
                                         {stockAdjData.type === 'Addition' ? '+' : '-'}{((parseInt(stockAdjData.crates) || 0) * stockAdjData.bpc) + (parseInt(stockAdjData.bottles) || 0)}
                                         <span className="text-[10px] font-normal uppercase ml-1 opacity-70">btls</span>
                                     </span>
                                 </div>
                                 <div className={`pt-3 mt-1 border-t-2 border-dashed flex justify-between items-center ${stockAdjData.type === 'Addition' ? 'border-emerald-200 dark:border-emerald-800' : 'border-orange-200 dark:border-orange-800'}`}>
                                     <span className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">Projected Total</span>
                                     <div className="text-right">
                                         <span className={`text-2xl font-black tabular-nums ${stockAdjData.type === 'Addition' ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>
                                             {stockAdjData.type === 'Addition'
                                                 ? stockAdjData.currentStock + ((parseInt(stockAdjData.crates) || 0) * stockAdjData.bpc) + (parseInt(stockAdjData.bottles) || 0)
                                                 : stockAdjData.currentStock - ((parseInt(stockAdjData.crates) || 0) * stockAdjData.bpc) - (parseInt(stockAdjData.bottles) || 0)
                                             }
                                         </span>
                                         <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1 uppercase">btls</span>
                                     </div>
                                 </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                 <button
                                     type="button"
                                     onClick={() => setIsStockAdjModalOpen(false)}
                                     disabled={isSubmitting}
                                     className="px-4 py-2 text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                                 >
                                     Cancel
                                 </button>
                                 <button
                                     type="submit"
                                     disabled={isSubmitting}
                                     className={`px-6 py-2 text-white rounded-lg font-medium shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 ${stockAdjData.type === 'Addition' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-emerald-950/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200 dark:shadow-orange-950/20'}`}
                                 >
                                     {isSubmitting ? <><Loader2 size={18} className="animate-spin" /><span>Saving...</span></> : <span>Confirm {stockAdjData.type}</span>}
                                 </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }

             {isHistoryModalOpen && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                     <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all h-[80vh] flex flex-col border border-transparent dark:border-slate-800">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-white">Stock Adjustment History</h2>
                                <p className="text-white/80 text-sm opacity-90">{selectedProduct?.name}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => downloadProductHistoryPDF(selectedProduct, stockHistory)}
                                    disabled={stockHistory.length === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
                                >
                                    <Download size={16} /> Export PDF
                                </button>
                                 <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                     <XCircle size={24} className="text-white" />
                                 </button>
                             </div>
                         </div>

                         <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                             {historyLoading ? (
                                 <div className="flex justify-center items-center h-full">
                                     <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
                                 </div>
                             ) : stockHistory.length === 0 ? (
                                 <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-slate-500">
                                     <Package size={48} className="mb-2 opacity-20" />
                                     <p>No stock adjustments found for this product.</p>
                                 </div>
                             ) : (
                                <div className="space-y-4">
                                     {stockHistory.map((item) => (
                                         <div key={item.id} className="border border-gray-100 dark:border-slate-800 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                             <div className="flex justify-between items-start mb-2">
                                                 <div className="flex items-center gap-2">
                                                     <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${item.type === 'Addition' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                                                         {item.type}
                                                     </span>
                                                     <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{item.quantity} bottles</span>
                                                 </div>
                                                 <span className="text-xs text-gray-400 dark:text-slate-500">
                                                    {new Date(item.createdAt).toLocaleString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                             </div>
                                             <p className="text-sm text-gray-600 dark:text-slate-400 mb-2 italic">"{item.remarks}"</p>
                                             <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                                                 <span>Adjusted by: {item.adjustedBy?.name || 'System'}</span>
                                                 <span>ID: #{item.id}</span>
                                             </div>
                                         </div>
                                     ))}
                                </div>
                            )}
                        </div>
                         <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end shrink-0">
                             <button
                                 onClick={() => setIsHistoryModalOpen(false)}
                                 className="px-6 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
                             >
                                 Close
                             </button>
                         </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Products;
