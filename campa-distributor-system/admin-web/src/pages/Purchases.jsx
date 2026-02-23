import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Package, Plus, Eye, Trash2, Search, X, Printer,
    ChevronDown, IndianRupee, ShoppingCart, BarChart2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ─── Print Template Component ────────────────────────────────────────────────
const PrintTemplate = ({ bill }) => {
    if (!bill) return null;
    return (
        <div id="print-bill" style={{ fontFamily: 'Arial, sans-serif', width: '100%', maxWidth: 720, margin: '0 auto', padding: 24, fontSize: 13 }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>A.C.M AGENCIES</div>
                <div style={{ fontSize: 11 }}>9/141/D, SANKARANKOVIL MAIN ROAD</div>
                <div style={{ fontSize: 11 }}>RAMAYANPATTI, TIRUNELVELI - 627538</div>
                <div style={{ fontSize: 11 }}>GSTIN : 33KFPPSO618L1ZU</div>
                <div style={{ fontSize: 11 }}>MOBILE : 9698511002, 9443333438</div>
            </div>

            {/* Bill Meta */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '3px 6px', fontWeight: 'bold', width: 130, border: '1px solid #ccc' }}>Bill No</td>
                        <td style={{ padding: '3px 6px', border: '1px solid #ccc' }}>{bill.billNo}</td>
                        <td style={{ padding: '3px 6px', fontWeight: 'bold', border: '1px solid #ccc' }}>Bill Date</td>
                        <td style={{ padding: '3px 6px', border: '1px solid #ccc' }}>{bill.billDate}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '3px 6px', fontWeight: 'bold', border: '1px solid #ccc' }}>Invoice No</td>
                        <td style={{ padding: '3px 6px', border: '1px solid #ccc' }}>{bill.invoiceNo}</td>
                        <td style={{ padding: '3px 6px', fontWeight: 'bold', border: '1px solid #ccc' }}>Supplier</td>
                        <td style={{ padding: '3px 6px', fontWeight: 'bold', border: '1px solid #ccc' }}>{bill.supplierName}</td>
                    </tr>
                </tbody>
            </table>

            {/* Title */}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 15, border: '1px solid #000', padding: '4px 0', marginBottom: 6 }}>
                SALES PURCHASE ENTRY
            </div>

            {/* Items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}>SNO</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'left' }}>DESCRIPTION</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}>Qty (Crates)</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}>RATE/BTL</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(bill.items || []).map((item, i) => (
                        <tr key={item.id}>
                            <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>{i + 1}</td>
                            <td style={{ border: '1px solid #ccc', padding: '3px 6px' }}>{item.description}</td>
                            <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'center' }}>{fmt(item.rate)}</td>
                            <td style={{ border: '1px solid #ccc', padding: '3px 6px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                        </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', background: '#f9f9f9' }}>
                        <td colSpan={2} style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>Total</td>
                        <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}>
                            {(bill.items || []).reduce((s, i) => s + i.quantity, 0)}
                        </td>
                        <td style={{ border: '1px solid #ccc' }}></td>
                        <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'right' }}>{fmt(bill.subTotal)}</td>
                    </tr>
                </tbody>
            </table>

            {/* GST Footer */}
            <table style={{ width: '260px', marginLeft: 'auto', marginBottom: 8, borderCollapse: 'collapse' }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '2px 6px', fontWeight: 'bold' }}>Cgst :</td>
                        <td style={{ padding: '2px 6px', textAlign: 'right' }}>{fmt(bill.cgstAmount)}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '2px 6px', fontWeight: 'bold' }}>Sgst :</td>
                        <td style={{ padding: '2px 6px', textAlign: 'right' }}>{fmt(bill.sgstAmount)}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '2px 6px', fontWeight: 'bold' }}>RounOff :</td>
                        <td style={{ padding: '2px 6px', textAlign: 'right' }}>{fmt(bill.roundOff)}</td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #000' }}>
                        <td style={{ padding: '4px 6px', fontWeight: 'bold', fontSize: 15 }}>Net Total:</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: 15 }}>{fmt(bill.netTotal)}</td>
                    </tr>
                </tbody>
            </table>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 17, borderTop: '2px solid #000', paddingTop: 8 }}>
                RS. {fmt0(bill.netTotal)}
            </div>
        </div>
    );
};

// ─── Empty item row ───────────────────────────────────────────────────────────
const emptyItem = () => ({ productId: '', description: '', quantity: '', rate: '', amount: 0 });

// ─── Main Page Component ──────────────────────────────────────────────────────
const Purchases = () => {
    const [activeTab, setActiveTab] = useState('bills'); // 'bills' | 'stock'
    const [bills, setBills] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const [products, setProducts] = useState([]);
    const [stockProducts, setStockProducts] = useState([]);
    const [stockSearch, setStockSearch] = useState('');

    // Create modal
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        billDate: new Date().toISOString().split('T')[0],
        invoiceNo: '',
        supplierName: '',
        cgstAmount: '',
        sgstAmount: '',
        roundOff: '',
        notes: '',
    });
    const [items, setItems] = useState([emptyItem()]);
    const [saving, setSaving] = useState(false);

    // View modal
    const [viewBill, setViewBill] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const printRef = useRef();

    // ── Fetch bills ───────────────────────────────────────────────────────────
    const fetchBills = async () => {
        setLoading(true);
        try {
            const res = await api.get('/purchase-bills', { params: { page, limit: 25, search } });
            setBills(res.data.bills);
            setTotal(res.data.total);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products?limit=500');
            setProducts(res.data.products || res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchStock = async () => {
        try {
            const res = await api.get('/products?limit=500');
            setStockProducts(res.data.products || res.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchBills(); }, [page, search]);
    useEffect(() => { fetchProducts(); }, []);
    useEffect(() => { if (activeTab === 'stock') fetchStock(); }, [activeTab]);

    // ── Derived totals ────────────────────────────────────────────────────────
    const subTotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
    const cgst = Number(form.cgstAmount) || 0;
    const sgst = Number(form.sgstAmount) || 0;
    const ro = Number(form.roundOff) || 0;
    const netTotal = subTotal + cgst + sgst + ro;

    // ── Item handlers ─────────────────────────────────────────────────────────
    const updateItem = (idx, key, val) => {
        setItems(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [key]: val };

            if (key === 'productId') {
                const prod = products.find(p => String(p.id) === String(val));
                if (prod) {
                    copy[idx].description = prod.name;
                    copy[idx].rate = prod.price || '';       // rate per bottle
                    copy[idx]._bpc = prod.bottlesPerCrate || 1;
                } else {
                    copy[idx]._bpc = 1;
                }
            }

            // Amount = crates × bottlesPerCrate × rate/bottle
            const bpc = copy[idx]._bpc || 1;
            const bottles = (Number(copy[idx].quantity) || 0) * bpc;
            const rate = Number(copy[idx].rate) || 0;
            copy[idx].amount = +(bottles * rate).toFixed(2);
            return copy;
        });
    };

    const addItem = () => setItems(p => [...p, emptyItem()]);
    const removeItem = (idx) => setItems(p => p.filter((_, i) => i !== idx));

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.invoiceNo || !form.supplierName) return alert('Fill Invoice No and Supplier');
        const validItems = items.filter(i => i.description && Number(i.quantity) > 0 && Number(i.rate) > 0);
        if (validItems.length === 0) return alert('Add at least one valid item');

        setSaving(true);
        try {
            await api.post('/purchase-bills', {
                ...form,
                cgstAmount: cgst,
                sgstAmount: sgst,
                roundOff: ro,
                items: validItems,
            });
            setShowCreate(false);
            resetForm();
            fetchBills();
            if (activeTab === 'stock') fetchStock();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to create purchase bill');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({ billDate: new Date().toISOString().split('T')[0], invoiceNo: '', supplierName: '', cgstAmount: '', sgstAmount: '', roundOff: '', notes: '' });
        setItems([emptyItem()]);
    };

    // ── View bill ─────────────────────────────────────────────────────────────
    const openView = async (id) => {
        setViewLoading(true);
        setViewBill(null);
        try {
            const res = await api.get(`/purchase-bills/${id}`);
            setViewBill(res.data);
        } catch (err) { console.error(err); }
        finally { setViewLoading(false); }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const deleteBill = async (id, billNo) => {
        if (!window.confirm(`Delete ${billNo}? Stock will be reversed.`)) return;
        try {
            await api.delete(`/purchase-bills/${id}`);
            fetchBills();
            if (activeTab === 'stock') fetchStock();
        } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
    };

    // ── Print ─────────────────────────────────────────────────────────────────
    const handlePrint = () => {
        const content = document.getElementById('print-bill').innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Purchase Bill</title><style>
            body{font-family:Arial,sans-serif;margin:20px}
            table{border-collapse:collapse;width:100%}
            td,th{border:1px solid #ccc;padding:4px 6px}
            @media print{button{display:none}}
        </style></head><body>${content}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 300);
    };

    // ── Filtered stock ────────────────────────────────────────────────────────
    const filteredStock = stockProducts.filter(p =>
        !stockSearch || p.name?.toLowerCase().includes(stockSearch.toLowerCase()) || p.sku?.toLowerCase().includes(stockSearch.toLowerCase())
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="animate-fade-in-up space-y-6">

            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <Package className="text-indigo-500" size={36} />
                        Purchases & Stock
                    </h1>
                    <p className="text-slate-500 mt-1">Manage purchase bills and view current stock</p>
                </div>
                <button
                    onClick={() => { setShowCreate(true); resetForm(); }}
                    className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
                >
                    <Plus size={18} /> New Purchase Bill
                </button>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-0">
                {[
                    { key: 'bills', label: 'Purchase Bills', icon: ShoppingCart },
                    { key: 'stock', label: 'Current Stock', icon: BarChart2 }
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm border-b-2 transition-all ${activeTab === key
                            ? 'border-indigo-600 text-indigo-700'
                            : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <Icon size={16} /> {label}
                    </button>
                ))}
            </div>

            {/* ─── BILLS TAB ─── */}
            {activeTab === 'bills' && (
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative w-72">
                        <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                        <input
                            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search supplier / bill / invoice..."
                            className="pl-9 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm w-full"
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {loading ? <div className="py-16 flex justify-center"><LoadingSpinner /></div> : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4 text-left font-semibold">Bill No</th>
                                            <th className="px-5 py-4 text-left font-semibold">Date</th>
                                            <th className="px-5 py-4 text-left font-semibold">Invoice No</th>
                                            <th className="px-5 py-4 text-left font-semibold">Supplier</th>
                                            <th className="px-5 py-4 text-right font-semibold">Net Total</th>
                                            <th className="px-5 py-4 text-left font-semibold">Created By</th>
                                            <th className="px-5 py-4 text-center font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-50">
                                        {bills.length === 0 && (
                                            <tr><td colSpan={7} className="py-14 text-center text-slate-400 italic">No purchase bills found</td></tr>
                                        )}
                                        {bills.map(bill => (
                                            <tr key={bill.id} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="px-5 py-4 font-bold text-indigo-700">{bill.billNo}</td>
                                                <td className="px-5 py-4 text-slate-600">{bill.billDate}</td>
                                                <td className="px-5 py-4 text-slate-600">{bill.invoiceNo}</td>
                                                <td className="px-5 py-4 font-semibold text-slate-700">{bill.supplierName}</td>
                                                <td className="px-5 py-4 text-right font-bold text-emerald-700">₹ {fmt(bill.netTotal)}</td>
                                                <td className="px-5 py-4 text-slate-500 text-xs">{bill.createdBy?.name || '—'}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => openView(bill.id)}
                                                            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors" title="View / Print">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button onClick={() => deleteBill(bill.id, bill.billNo)}
                                                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Delete">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {/* Pagination */}
                        {total > 25 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                                <span>{total} total bills</span>
                                <div className="flex gap-2">
                                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-40 hover:bg-slate-50">Prev</button>
                                    <span className="px-3 py-1.5 font-semibold">Page {page}</span>
                                    <button disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-40 hover:bg-slate-50">Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── STOCK TAB ─── */}
            {activeTab === 'stock' && (
                <div className="space-y-4">
                    <div className="relative w-72">
                        <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
                        <input
                            value={stockSearch} onChange={e => setStockSearch(e.target.value)}
                            placeholder="Search product or SKU..."
                            className="pl-9 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm w-full"
                        />
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold">Product</th>
                                        <th className="px-6 py-4 text-left font-semibold">SKU</th>
                                        <th className="px-6 py-4 text-left font-semibold">Group</th>
                                        <th className="px-6 py-4 text-center font-semibold">Stock Qty</th>
                                        <th className="px-6 py-4 text-center font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-slate-50">
                                    {filteredStock.length === 0 && (
                                        <tr><td colSpan={5} className="py-14 text-center text-slate-400 italic">No products</td></tr>
                                    )}
                                    {filteredStock.map(p => (
                                        <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-700">{p.name}</td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">{p.sku || '—'}</td>
                                            <td className="px-6 py-4 text-slate-500">{p.groupName || '—'}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-800">{p.stockQuantity}</td>
                                            <td className="px-6 py-4 text-center">
                                                {p.stockQuantity <= 0
                                                    ? <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Out of Stock</span>
                                                    : p.stockQuantity < 50
                                                        ? <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Low Stock</span>
                                                        : <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">In Stock</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── CREATE MODAL ─── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 my-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Package size={22} className="text-indigo-500" /> New Purchase Bill
                            </h2>
                            <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
                        </div>

                        <div className="px-8 py-6 space-y-6">
                            {/* Bill Header Fields */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Bill Date</label>
                                    <input type="date" value={form.billDate}
                                        onChange={e => setForm(f => ({ ...f, billDate: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Invoice No (Supplier)</label>
                                    <input type="text" placeholder="e.g. 000185" value={form.invoiceNo}
                                        onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Supplier Name</label>
                                    <input type="text" placeholder="e.g. SHARANG TRADERS" value={form.supplierName}
                                        onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
                                </div>
                            </div>

                            {/* Title bar */}
                            <div className="text-center font-bold text-slate-700 bg-slate-100 rounded-xl py-2 tracking-widest text-sm uppercase">
                                Sales Purchase Entry
                            </div>

                            {/* Items Table */}
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-8">SNO</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase min-w-[200px]">Description</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase min-w-[160px]">Link Product (opt.)</th>
                                            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase w-24">Qty (Crates)</th>
                                            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 uppercase w-28">Rate/Bottle</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase w-28">Amount</th>
                                            <th className="px-3 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 text-slate-400 text-xs text-center">{idx + 1}</td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={e => updateItem(idx, 'description', e.target.value)}
                                                        placeholder="Product description"
                                                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
                                                    />
                                                </td>
                                                <td className="px-2 py-2">
                                                    <select
                                                        value={item.productId}
                                                        onChange={e => updateItem(idx, 'productId', e.target.value)}
                                                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-400 outline-none bg-white"
                                                    >
                                                        <option value="">-- None --</option>
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="number" min="1"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                        placeholder="0"
                                                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:ring-1 focus:ring-indigo-400 outline-none"
                                                    />
                                                    {item.productId && (() => {
                                                        const prod = products.find(p => String(p.id) === String(item.productId));
                                                        const bpc = prod?.bottlesPerCrate || 1;
                                                        const bottles = (Number(item.quantity) || 0) * bpc;
                                                        return bottles > 0
                                                            ? <div className="text-center text-xs text-indigo-500 mt-0.5">{bottles} btls</div>
                                                            : null;
                                                    })()}
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="number" min="0" step="0.01"
                                                        value={item.rate}
                                                        onChange={e => updateItem(idx, 'rate', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:ring-1 focus:ring-indigo-400 outline-none"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right font-semibold text-slate-700">
                                                    {fmt(item.amount)}
                                                </td>
                                                <td className="px-2 py-2">
                                                    {items.length > 1 && (
                                                        <button onClick={() => removeItem(idx)}
                                                            className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={7} className="px-3 py-2">
                                                <button onClick={addItem}
                                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors">
                                                    <Plus size={15} /> Add Row
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                                            <td colSpan={4} className="px-3 py-3 text-slate-500 text-right text-xs uppercase">Sub Total</td>
                                            <td></td>
                                            <td className="px-3 py-3 text-right text-slate-800">₹ {fmt(subTotal)}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* GST + Totals */}
                            <div className="flex justify-end">
                                <div className="w-full max-w-xs space-y-3">
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">CGST (₹)</label>
                                            <input type="number" value={form.cgstAmount} onChange={e => setForm(f => ({ ...f, cgstAmount: e.target.value }))}
                                                placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none text-right" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">SGST (₹)</label>
                                            <input type="number" value={form.sgstAmount} onChange={e => setForm(f => ({ ...f, sgstAmount: e.target.value }))}
                                                placeholder="0.00" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none text-right" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Round Off</label>
                                            <input type="number" value={form.roundOff} onChange={e => setForm(f => ({ ...f, roundOff: e.target.value }))}
                                                placeholder="0.00" step="0.01" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none text-right" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                                        <span className="font-bold text-indigo-800 text-sm uppercase tracking-wide">Net Total</span>
                                        <span className="text-2xl font-extrabold text-indigo-700">₹ {fmt(netTotal)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Notes (optional)</label>
                                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                    rows={2} placeholder="Any remarks..."
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none" />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowCreate(false)} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all">Cancel</button>
                            <button onClick={handleSubmit} disabled={saving}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-60">
                                {saving ? <LoadingSpinner size="sm" /> : <Plus size={18} />}
                                Create Purchase Bill
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── VIEW / PRINT MODAL ─── */}
            {(viewBill || viewLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 my-auto">
                        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100">
                            <h2 className="font-bold text-slate-800 text-lg">Purchase Bill — {viewBill?.billNo}</h2>
                            <div className="flex gap-2">
                                {viewBill && (
                                    <button onClick={handlePrint}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm transition-all">
                                        <Printer size={16} /> Print
                                    </button>
                                )}
                                <button onClick={() => setViewBill(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
                            </div>
                        </div>
                        <div className="p-8">
                            {viewLoading ? <div className="py-16 flex justify-center"><LoadingSpinner /></div>
                                : <PrintTemplate bill={viewBill} />}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;
