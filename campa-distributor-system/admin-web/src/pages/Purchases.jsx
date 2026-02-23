import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import {
    Package, Plus, Eye, Trash2, Search, X, Printer,
    ClipboardList, BarChart2, ChevronRight, Calendar,
    Building2, Hash, FileText, ShoppingBag, AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const toDate = (s) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Print Template ───────────────────────────────────────────────────────────
const PrintTemplate = ({ bill }) => {
    if (!bill) return null;
    return (
        <div id="print-bill" style={{ fontFamily: 'Arial, sans-serif', width: '100%', maxWidth: 680, margin: '0 auto', padding: 24, fontSize: 13 }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 'bold', letterSpacing: 1 }}>A.C.M AGENCIES</div>
                <div style={{ fontSize: 11, color: '#333' }}>9/141/D, SANKARANKOVIL MAIN ROAD, RAMAYANPATTI, TIRUNELVELI - 627538</div>
                <div style={{ fontSize: 11, color: '#333' }}>GSTIN : 33KFPPSO618L1ZU &nbsp;|&nbsp; MOBILE : 9698511002, 9443333438</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold', width: 120, border: '1px solid #ccc', background: '#f8f8f8' }}>Bill No</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #ccc' }}>{bill.billNo}</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold', border: '1px solid #ccc', background: '#f8f8f8' }}>Bill Date</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #ccc' }}>{bill.billDate}</td>
                    </tr>
                    <tr>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold', border: '1px solid #ccc', background: '#f8f8f8' }}>Invoice No</td>
                        <td style={{ padding: '4px 8px', border: '1px solid #ccc' }}>{bill.invoiceNo}</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold', border: '1px solid #ccc', background: '#f8f8f8' }}>Supplier</td>
                        <td style={{ padding: '4px 8px', fontWeight: 'bold', border: '1px solid #ccc' }}>{bill.supplierName}</td>
                    </tr>
                </tbody>
            </table>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, border: '1px solid #333', padding: '5px 0', marginBottom: 8, background: '#f4f4f4', letterSpacing: 2 }}>
                SALES PURCHASE ENTRY
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
                <thead>
                    <tr style={{ background: '#e8e8e8' }}>
                        <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', width: 40 }}>SNO</th>
                        <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'left' }}>DESCRIPTION</th>
                        <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', width: 70 }}>Qty</th>
                        <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center', width: 90 }}>RATE/CRATE</th>
                        <th style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'right', width: 100 }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {(bill.items || []).map((item, i) => (
                        <tr key={item.id}>
                            <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'center' }}>{i + 1}</td>
                            <td style={{ border: '1px solid #ccc', padding: '4px 8px' }}>{item.description}</td>
                            <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'center' }}>{fmt(item.rate)}</td>
                            <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'right' }}>{fmt(item.amount)}</td>
                        </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', background: '#f8f8f8' }}>
                        <td colSpan={2} style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'right' }}>Total</td>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'center' }}>
                            {(bill.items || []).reduce((s, i) => s + Number(i.quantity), 0)}
                        </td>
                        <td style={{ border: '1px solid #ccc' }}></td>
                        <td style={{ border: '1px solid #ccc', padding: '5px 8px', textAlign: 'right' }}>{fmt(bill.subTotal)}</td>
                    </tr>
                </tbody>
            </table>
            <table style={{ width: 260, marginLeft: 'auto', marginBottom: 10 }}>
                <tbody>
                    {[['Cgst :', bill.cgstAmount], ['Sgst :', bill.sgstAmount], ['RoundOff :', bill.roundOff]].map(([label, val]) => (
                        <tr key={label}>
                            <td style={{ padding: '2px 8px', fontWeight: 'bold' }}>{label}</td>
                            <td style={{ padding: '2px 8px', textAlign: 'right' }}>{fmt(val)}</td>
                        </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #333' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: 15 }}>Net Total:</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: 15 }}>{fmt(bill.netTotal)}</td>
                    </tr>
                </tbody>
            </table>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18, borderTop: '2px solid #000', paddingTop: 8 }}>
                RS. {fmt0(bill.netTotal)}
            </div>
        </div>
    );
};

// ─── Empty item ───────────────────────────────────────────────────────────────
const emptyItem = () => ({ productId: '', description: '', quantity: '', rate: '', amount: 0, _bpc: 1 });

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color }) => (
    <div className={`rounded-2xl p-5 border ${color} bg-white shadow-sm`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const Purchases = () => {
    const [activeTab, setActiveTab] = useState('bills');
    const [bills, setBills] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const [products, setProducts] = useState([]);
    const [stockProducts, setStockProducts] = useState([]);
    const [stockSearch, setStockSearch] = useState('');

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

    const [viewBill, setViewBill] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);

    // ── Fetch ─────────────────────────────────────────────────────────────────
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

    // ── Totals ────────────────────────────────────────────────────────────────
    const subTotal = items.reduce((s, i) => s + Number(i.amount || 0), 0);
    const cgst = Number(form.cgstAmount) || 0;
    const sgst = Number(form.sgstAmount) || 0;
    const ro = Number(form.roundOff) || 0;
    const netTotal = subTotal + cgst + sgst + ro;
    const totalCrates = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);

    // ── Item handlers ─────────────────────────────────────────────────────────
    const updateItem = (idx, key, val) => {
        setItems(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [key]: val };

            if (key === 'productId') {
                const prod = products.find(p => String(p.id) === String(val));
                if (prod) {
                    copy[idx].description = prod.name;
                    copy[idx]._bpc = prod.bottlesPerCrate || 1;
                    // Rate per CRATE = price/bottle × bottlesPerCrate
                    copy[idx].rate = prod.price
                        ? +(Number(prod.price) * (prod.bottlesPerCrate || 1)).toFixed(2)
                        : '';
                } else {
                    copy[idx]._bpc = 1;
                }
            }

            // Amount = crates × rate/crate
            const crates = Number(copy[idx].quantity) || 0;
            const rate = Number(copy[idx].rate) || 0;
            copy[idx].amount = +(crates * rate).toFixed(2);
            return copy;
        });
    };

    const addItem = () => setItems(p => [...p, emptyItem()]);
    const removeItem = (idx) => setItems(p => p.filter((_, i) => i !== idx));

    const resetForm = () => {
        setForm({ billDate: new Date().toISOString().split('T')[0], invoiceNo: '', supplierName: '', cgstAmount: '', sgstAmount: '', roundOff: '', notes: '' });
        setItems([emptyItem()]);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.invoiceNo.trim() || !form.supplierName.trim()) return alert('Invoice No and Supplier name are required');
        const validItems = items.filter(i => i.description && Number(i.quantity) > 0 && Number(i.rate) > 0);
        if (validItems.length === 0) return alert('Add at least one valid item with description, qty and rate');
        setSaving(true);
        try {
            await api.post('/purchase-bills', { ...form, cgstAmount: cgst, sgstAmount: sgst, roundOff: ro, items: validItems });
            setShowCreate(false);
            resetForm();
            fetchBills();
            if (activeTab === 'stock') fetchStock();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create purchase bill');
        } finally { setSaving(false); }
    };

    // ── View ──────────────────────────────────────────────────────────────────
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
        if (!window.confirm(`Delete ${billNo}? This will reverse the stock.`)) return;
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
        win.document.write(`<html><head><title>Purchase Bill</title>
        <style>body{font-family:Arial,sans-serif;margin:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:4px 8px}@media print{button{display:none}}</style>
        </head><body>${content}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 300);
    };

    // ── Stock filter ──────────────────────────────────────────────────────────
    const filteredStock = stockProducts.filter(p =>
        !stockSearch || p.name?.toLowerCase().includes(stockSearch.toLowerCase()) || p.sku?.toLowerCase().includes(stockSearch.toLowerCase())
    );
    const inStock = filteredStock.filter(p => p.stockQuantity > 50).length;
    const lowStock = filteredStock.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 50).length;
    const outOfStock = filteredStock.filter(p => p.stockQuantity <= 0).length;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="animate-fade-in-up space-y-6">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 rounded-xl"><Package className="text-indigo-600" size={28} /></div>
                        Purchases & Stock
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 ml-16">Create purchase bills · track supplier invoices · monitor stock levels</p>
                </div>
                <button
                    onClick={() => { setShowCreate(true); resetForm(); }}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm"
                >
                    <Plus size={18} /> New Purchase Bill
                </button>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {[{ key: 'bills', label: 'Purchase Bills', icon: ClipboardList }, { key: 'stock', label: 'Current Stock', icon: BarChart2 }].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-lg transition-all ${activeTab === key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Icon size={16} />{label}
                    </button>
                ))}
            </div>

            {/* ════ BILLS TAB ════ */}
            {activeTab === 'bills' && (
                <div className="space-y-4">
                    <div className="relative w-80">
                        <Search size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search bill no, supplier, invoice..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm bg-white shadow-sm" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {loading ? (
                            <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                            <th className="px-6 py-4 text-left font-semibold">Bill No</th>
                                            <th className="px-6 py-4 text-left font-semibold">Date</th>
                                            <th className="px-6 py-4 text-left font-semibold">Invoice No</th>
                                            <th className="px-6 py-4 text-left font-semibold">Supplier</th>
                                            <th className="px-6 py-4 text-right font-semibold">Net Total</th>
                                            <th className="px-6 py-4 text-center font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-sm">
                                        {bills.length === 0 && (
                                            <tr><td colSpan={6} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                                    <ShoppingBag size={40} className="opacity-30" />
                                                    <span className="font-medium">No purchase bills yet</span>
                                                    <button onClick={() => { setShowCreate(true); resetForm(); }}
                                                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center gap-1">
                                                        <Plus size={14} /> Create your first bill
                                                    </button>
                                                </div>
                                            </td></tr>
                                        )}
                                        {bills.map((bill, i) => (
                                            <tr key={bill.id} className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                                                        <Hash size={11} />{bill.billNo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">{toDate(bill.billDate)}</td>
                                                <td className="px-6 py-4 text-slate-600 font-mono text-xs">{bill.invoiceNo}</td>
                                                <td className="px-6 py-4 font-semibold text-slate-700">{bill.supplierName}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-extrabold text-emerald-700 text-base">₹{fmt(bill.netTotal)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => openView(bill.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors">
                                                            <Eye size={13} /> View
                                                        </button>
                                                        <button onClick={() => deleteBill(bill.id, bill.billNo)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors">
                                                            <Trash2 size={13} /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {total > 25 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-sm">
                                <span className="text-slate-400">{total} total bills</span>
                                <div className="flex items-center gap-2">
                                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-slate-50 font-medium">← Prev</button>
                                    <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-sm">{page}</span>
                                    <button disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 hover:bg-slate-50 font-medium">Next →</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ════ STOCK TAB ════ */}
            {activeTab === 'stock' && (
                <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard label="In Stock" value={inStock} sub="Products with qty > 50" color="border-emerald-200" />
                        <StatCard label="Low Stock" value={lowStock} sub="Products with qty ≤ 50" color="border-amber-200" />
                        <StatCard label="Out of Stock" value={outOfStock} sub="Products with qty = 0" color="border-red-200" />
                    </div>
                    <div className="relative w-80">
                        <Search size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                        <input value={stockSearch} onChange={e => setStockSearch(e.target.value)}
                            placeholder="Search product or SKU..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm bg-white shadow-sm" />
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left font-semibold">Product</th>
                                        <th className="px-6 py-4 text-left font-semibold">SKU</th>
                                        <th className="px-6 py-4 text-left font-semibold">Group</th>
                                        <th className="px-6 py-4 text-center font-semibold">Btls/Crate</th>
                                        <th className="px-6 py-4 text-center font-semibold">Stock (Bottles)</th>
                                        <th className="px-6 py-4 text-center font-semibold">Equiv. Crates</th>
                                        <th className="px-6 py-4 text-center font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm">
                                    {filteredStock.length === 0 && (
                                        <tr><td colSpan={7} className="py-16 text-center text-slate-400">No products found</td></tr>
                                    )}
                                    {filteredStock.map((p, i) => {
                                        const bpc = p.bottlesPerCrate || 1;
                                        const crates = Math.floor(p.stockQuantity / bpc);
                                        return (
                                            <tr key={p.id} className={`hover:bg-indigo-50/20 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                                                <td className="px-6 py-4 font-semibold text-slate-700">{p.name}</td>
                                                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{p.sku || '—'}</td>
                                                <td className="px-6 py-4 text-slate-500">{p.groupName || '—'}</td>
                                                <td className="px-6 py-4 text-center text-slate-600 font-mono">{bpc}</td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-800">{p.stockQuantity}</td>
                                                <td className="px-6 py-4 text-center text-slate-500 text-sm">≈ {crates}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {p.stockQuantity <= 0
                                                        ? <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Out of Stock</span>
                                                        : p.stockQuantity <= 50
                                                            ? <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Low Stock</span>
                                                            : <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">In Stock</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ CREATE MODAL ════ */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto overflow-hidden">

                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileText size={22} /> New Purchase Bill
                                </h2>
                                <p className="text-indigo-200 text-xs mt-0.5">Fill in the supplier invoice details and items</p>
                            </div>
                            <button onClick={() => setShowCreate(false)}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-8 py-7 space-y-7">

                            {/* ── Bill Header Fields ── */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <div className="h-px bg-slate-200 flex-1" /> Bill Details <div className="h-px bg-slate-200 flex-1" />
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Bill Date */}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                            <Calendar size={12} className="text-indigo-400" /> Bill Date
                                        </label>
                                        <input type="date" value={form.billDate}
                                            onChange={e => setForm(f => ({ ...f, billDate: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm" />
                                    </div>
                                    {/* Invoice No */}
                                    <div className="space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                            <Hash size={12} className="text-indigo-400" /> Invoice No
                                        </label>
                                        <input type="text" placeholder="e.g. 000185" value={form.invoiceNo}
                                            onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm" />
                                    </div>
                                    {/* Supplier */}
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                            <Building2 size={12} className="text-indigo-400" /> Supplier Name
                                        </label>
                                        <input type="text" placeholder="e.g. SHARANG TRADERS" value={form.supplierName}
                                            onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
                                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* ── Items Table ── */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <div className="h-px bg-slate-200 flex-1" /> Sales Purchase Entry <div className="h-px bg-slate-200 flex-1" />
                                </h3>

                                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    {/* Table Header */}
                                    <div className="grid bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs font-semibold uppercase tracking-wider"
                                        style={{ gridTemplateColumns: '36px 1fr 180px 90px 110px 100px 36px' }}>
                                        <div className="px-3 py-3 text-center">#</div>
                                        <div className="px-3 py-3">Description</div>
                                        <div className="px-3 py-3">Link Product</div>
                                        <div className="px-3 py-3 text-center">Crates</div>
                                        <div className="px-3 py-3 text-center">Rate/Crate</div>
                                        <div className="px-3 py-3 text-right">Amount</div>
                                        <div className="px-3 py-3"></div>
                                    </div>

                                    {/* Rows */}
                                    <div className="divide-y divide-slate-100">
                                        {items.map((item, idx) => {
                                            const bpc = item._bpc || 1;
                                            const bottles = (Number(item.quantity) || 0) * bpc;
                                            return (
                                                <div key={idx}
                                                    className={`grid items-center gap-1 px-1 py-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                                                    style={{ gridTemplateColumns: '36px 1fr 180px 90px 110px 100px 36px' }}>
                                                    {/* SNO */}
                                                    <div className="text-center text-xs text-slate-400 font-semibold">{idx + 1}</div>

                                                    {/* Description */}
                                                    <div className="px-1">
                                                        <input type="text" value={item.description}
                                                            onChange={e => updateItem(idx, 'description', e.target.value)}
                                                            placeholder="Product name..."
                                                            className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                                    </div>

                                                    {/* Product Link */}
                                                    <div className="px-1">
                                                        <select value={item.productId}
                                                            onChange={e => updateItem(idx, 'productId', e.target.value)}
                                                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-300 outline-none bg-white">
                                                            <option value="">— None —</option>
                                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Crates */}
                                                    <div className="px-1">
                                                        <input type="number" min="1" value={item.quantity}
                                                            onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                            placeholder="0"
                                                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-300 outline-none" />
                                                        {bottles > 0 && (
                                                            <div className="text-center text-xs text-violet-500 font-semibold mt-0.5">{bottles} btls</div>
                                                        )}
                                                    </div>

                                                    {/* Rate/Crate */}
                                                    <div className="px-1">
                                                        <input type="number" min="0" step="0.01" value={item.rate}
                                                            onChange={e => updateItem(idx, 'rate', e.target.value)}
                                                            placeholder="0.00"
                                                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-300 outline-none" />
                                                    </div>

                                                    {/* Amount */}
                                                    <div className="px-2 text-right font-bold text-sm text-slate-700">
                                                        {item.amount > 0 ? `₹${fmt(item.amount)}` : <span className="text-slate-300">—</span>}
                                                    </div>

                                                    {/* Remove */}
                                                    <div className="flex justify-center">
                                                        {items.length > 1 && (
                                                            <button onClick={() => removeItem(idx)}
                                                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Footer: Add Row + Sub Total */}
                                    <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex justify-between items-center">
                                        <button onClick={addItem}
                                            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors">
                                            <Plus size={15} /> Add Row
                                        </button>
                                        <div className="flex items-center gap-6 text-sm">
                                            <span className="text-slate-500">Total Crates: <strong className="text-slate-700">{totalCrates}</strong></span>
                                            <span className="text-slate-500">Sub Total: <strong className="text-slate-800 text-base">₹{fmt(subTotal)}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── GST + Totals + Notes ── */}
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Notes */}
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes (optional)</label>
                                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                        rows={3} placeholder="Any remarks about this purchase..."
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none shadow-sm" />
                                </div>

                                {/* GST + Net Total */}
                                <div className="w-full md:w-72 space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { key: 'cgstAmount', label: 'CGST ₹' },
                                            { key: 'sgstAmount', label: 'SGST ₹' },
                                            { key: 'roundOff', label: 'Round Off' },
                                        ].map(({ key, label }) => (
                                            <div key={key}>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
                                                <input type="number" step="0.01" value={form[key]}
                                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                                    placeholder="0.00"
                                                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none text-right shadow-sm" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white">
                                        <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Net Total</div>
                                        <div className="text-3xl font-extrabold">₹{fmt(netTotal)}</div>
                                        <div className="text-xs opacity-70 mt-1">Sub ₹{fmt(subTotal)} + GST ₹{fmt(cgst + sgst)} + RO ₹{fmt(ro)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowCreate(false)}
                                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-all text-sm">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={saving}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-60 text-sm">
                                {saving ? <LoadingSpinner size="sm" /> : <Plus size={18} />}
                                Create Purchase Bill
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ VIEW/PRINT MODAL ════ */}
            {(viewBill || viewLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-auto overflow-hidden">
                        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100">
                            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <FileText size={20} className="text-indigo-500" />
                                {viewBill?.billNo} — {viewBill?.supplierName}
                            </h2>
                            <div className="flex gap-2">
                                {viewBill && (
                                    <button onClick={handlePrint}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold text-sm transition-all">
                                        <Printer size={15} /> Print
                                    </button>
                                )}
                                <button onClick={() => setViewBill(null)}
                                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-8">
                            {viewLoading ? <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                                : <PrintTemplate bill={viewBill} />}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;
