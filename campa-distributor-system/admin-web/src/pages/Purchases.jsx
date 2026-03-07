import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Package, Plus, Eye, Trash2, Search, X, Printer,
    ClipboardList, BarChart2, ChevronRight, Calendar,
    Building2, Hash, FileText, ShoppingBag, Truck,
    TrendingUp, AlertTriangle, CheckCircle, ArrowLeft,
    IndianRupee, Box, Layers, ChevronLeft, ChevronRight as ChevRight,
    Download, RefreshCw, XCircle as XCircleIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import LoadingSpinner from '../components/LoadingSpinner';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const toDate = (s) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Print Template ──────────────────────────────────────────────────────────
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

const emptyItem = () => ({ productId: '', description: '', quantity: '', rate: '', amount: 0, _bpc: 1 });

// ─── Main Page ───────────────────────────────────────────────────────────────
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
    const [stockFilter, setStockFilter] = useState('all');

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

    // ── Report date range ─────────────────────────────────────────────────────
    const [reportFrom, setReportFrom] = useState(new Date().toISOString().split('T')[0]);
    const [reportTo, setReportTo] = useState(new Date().toISOString().split('T')[0]);
    const [reportLoading, setReportLoading] = useState(false);

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

    const fetchStockHistoryData = async () => {
        setStockHistoryLoading(true);
        try {
            const params = {
                page: 1,
                limit: 1000,
                type: historyFilters.type === 'All' ? undefined : historyFilters.type,
                productId: historyFilters.productId || undefined,
                startDate: historyFilters.startDate || undefined,
                endDate: historyFilters.endDate || undefined
            };
            const response = await api.get('/products/stock-adjustments/history', { params });
            setStockHistory(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch stock history", error);
        } finally {
            setStockHistoryLoading(false);
        }
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
                    copy[idx].rate = prod.price
                        ? +(Number(prod.price) * (prod.bottlesPerCrate || 1)).toFixed(2)
                        : '';
                } else {
                    copy[idx]._bpc = 1;
                }
            }
            const crates = Number(copy[idx].quantity) || 0;
            const rate = Number(copy[idx].rate) || 0;
            copy[idx].amount = +(crates * rate).toFixed(2);
            return copy;
        });
    };

    const addItem = () => setItems(p => [...p, emptyItem()]);
    const removeItem = (idx) => {
        if (!Array.isArray(items)) {
            console.warn("Filter warning: 'items' is not an array in Purchases.jsx (removeItem). Type:", typeof items, "Value:", items);
        }
        setItems(p => (Array.isArray(p) ? p : []).filter((_, i) => i !== idx));
    };

    const resetForm = () => {
        setForm({ billDate: new Date().toISOString().split('T')[0], invoiceNo: '', supplierName: '', cgstAmount: '', sgstAmount: '', roundOff: '', notes: '' });
        setItems([emptyItem()]);
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!form.invoiceNo.trim() || !form.supplierName.trim()) return alert('Invoice No and Supplier name are required');
        if (!Array.isArray(items)) {
            console.warn("Filter warning: 'items' is not an array in Purchases.jsx (handleSubmit). Type:", typeof items, "Value:", items);
        }
        const validItems = (Array.isArray(items) ? items : []).filter(i => i.description && Number(i.quantity) > 0 && Number(i.rate) > 0);
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

    // ── Delete ─────────────────────────────────────────────────────────────────
    const deleteBill = async (id, billNo) => {
        if (!window.confirm(`Delete ${billNo}? This will reverse the stock.`)) return;
        try {
            await api.delete(`/purchase-bills/${id}`);
            fetchBills();
            if (activeTab === 'stock') fetchStock();
        } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
    };

    // ── Generate InvoiceWise Stock Purchase Report ────────────────────────────
    const generateReport = async () => {
        if (!reportFrom || !reportTo) return alert('Please select a date range');
        setReportLoading(true);
        try {
            const res = await api.get('/purchase-bills', {
                params: { page: 1, limit: 1000, startDate: reportFrom, endDate: reportTo, withItems: 'true' }
            });
            const billsData = res.data.bills || [];
            if (billsData.length === 0) {
                alert('No purchase bills found for the selected date range.');
                return;
            }

            const fmtN = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const fmtDate = (s) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

            let grandSubTotal = 0, grandCgst = 0, grandSgst = 0, grandNet = 0, grandCrates = 0;

            const billSections = billsData.map((bill, bIdx) => {
                const items = bill.items || [];
                const totalCratesInBill = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
                grandSubTotal += Number(bill.subTotal || 0);
                grandCgst += Number(bill.cgstAmount || 0);
                grandSgst += Number(bill.sgstAmount || 0);
                grandNet += Number(bill.netTotal || 0);
                grandCrates += totalCratesInBill;

                const rows = items.map((item, idx) => `
                    <tr>
                        <td style="border:1px solid #ccc;padding:4px 8px;text-align:center">${idx + 1}</td>
                        <td style="border:1px solid #ccc;padding:4px 8px">${item.description || item.product?.name || '—'}</td>
                        <td style="border:1px solid #ccc;padding:4px 8px;text-align:center">${item.quantity}</td>
                        <td style="border:1px solid #ccc;padding:4px 8px;text-align:right">${fmtN(item.rate)}</td>
                        <td style="border:1px solid #ccc;padding:4px 8px;text-align:right">${fmtN(item.amount)}</td>
                    </tr>`).join('');

                return `
                <div style="margin-bottom:28px;page-break-inside:avoid">
                    <table style="width:100%;border-collapse:collapse;margin-bottom:6px;font-size:12px">
                        <tbody>
                            <tr>
                                <td style="padding:4px 8px;font-weight:bold;width:120px;border:1px solid #ccc;background:#f0f0f0">Bill No</td>
                                <td style="padding:4px 8px;border:1px solid #ccc">${bill.billNo}</td>
                                <td style="padding:4px 8px;font-weight:bold;border:1px solid #ccc;background:#f0f0f0">Bill Date</td>
                                <td style="padding:4px 8px;border:1px solid #ccc">${fmtDate(bill.billDate)}</td>
                            </tr>
                            <tr>
                                <td style="padding:4px 8px;font-weight:bold;border:1px solid #ccc;background:#f0f0f0">Invoice No</td>
                                <td style="padding:4px 8px;border:1px solid #ccc">${bill.invoiceNo}</td>
                                <td style="padding:4px 8px;font-weight:bold;border:1px solid #ccc;background:#f0f0f0">Supplier</td>
                                <td style="padding:4px 8px;font-weight:bold;border:1px solid #ccc">${bill.supplierName}</td>
                            </tr>
                        </tbody>
                    </table>

                    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px">
                        <thead>
                            <tr style="background:#e8e8e8">
                                <th style="border:1px solid #ccc;padding:5px 8px;text-align:center;width:40px">S.No</th>
                                <th style="border:1px solid #ccc;padding:5px 8px;text-align:left">Description</th>
                                <th style="border:1px solid #ccc;padding:5px 8px;text-align:center;width:70px">Qty (Crates)</th>
                                <th style="border:1px solid #ccc;padding:5px 8px;text-align:right;width:110px">Rate / Crate</th>
                                <th style="border:1px solid #ccc;padding:5px 8px;text-align:right;width:110px">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                            <tr style="font-weight:bold;background:#f8f8f8">
                                <td colspan="2" style="border:1px solid #ccc;padding:5px 8px;text-align:right">Total</td>
                                <td style="border:1px solid #ccc;padding:5px 8px;text-align:center">${totalCratesInBill}</td>
                                <td style="border:1px solid #ccc;"></td>
                                <td style="border:1px solid #ccc;padding:5px 8px;text-align:right">${fmtN(bill.subTotal)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <table style="width:260px;margin-left:auto;font-size:12px;border-collapse:collapse">
                        <tbody>
                            ${Number(bill.cgstAmount) ? `<tr><td style="padding:2px 8px;font-weight:bold">CGST :</td><td style="padding:2px 8px;text-align:right">${fmtN(bill.cgstAmount)}</td></tr>` : ''}
                            ${Number(bill.sgstAmount) ? `<tr><td style="padding:2px 8px;font-weight:bold">SGST :</td><td style="padding:2px 8px;text-align:right">${fmtN(bill.sgstAmount)}</td></tr>` : ''}
                            ${Number(bill.roundOff) ? `<tr><td style="padding:2px 8px;font-weight:bold">Round Off :</td><td style="padding:2px 8px;text-align:right">${fmtN(bill.roundOff)}</td></tr>` : ''}
                            <tr style="border-top:2px solid #333">
                                <td style="padding:6px 8px;font-weight:bold;font-size:14px">Net Total :</td>
                                <td style="padding:6px 8px;text-align:right;font-weight:bold;font-size:14px">${fmtN(bill.netTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>`;
            }).join('<hr style="border:none;border-top:1px dashed #ccc;margin:20px 0">');

            const html = `<!DOCTYPE html>
<html>
<head>
    <title>Stock Purchase InvoiceWise Report — ${fmtDate(reportFrom)} to ${fmtDate(reportTo)}</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
        @media print { button { display:none } }
        h2 { font-size:13px; font-weight:bold; }
    </style>
</head>
<body>
    <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:16px">
        <div style="font-size:22px;font-weight:bold;letter-spacing:1px">A.C.M AGENCIES</div>
        <div style="font-size:11px;color:#333">9/141/D, SANKARANKOVIL MAIN ROAD, RAMAYANPATTI, TIRUNELVELI - 627538</div>
        <div style="font-size:11px;color:#333">GSTIN : 33KFPPSO618L1ZU &nbsp;|&nbsp; MOBILE : 9698511002, 9443333438</div>
    </div>
    <div style="text-align:center;font-weight:bold;font-size:15px;border:1px solid #333;padding:5px;margin-bottom:18px;background:#f4f4f4;letter-spacing:2px">
        STOCK PURCHASE INVOICE WISE REPORT
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:12px;font-weight:bold">
        <span>Period: ${fmtDate(reportFrom)} to ${fmtDate(reportTo)}</span>
        <span>Total Invoices: ${billsData.length}</span>
    </div>

    ${billSections}

    <div style="margin-top:30px;border-top:3px double #000;padding-top:10px">
        <div style="text-align:center;font-weight:bold;font-size:14px;letter-spacing:1px;margin-bottom:10px">GRAND TOTAL SUMMARY</div>
        <table style="width:340px;margin:0 auto;border-collapse:collapse;font-size:13px">
            <tr style="background:#e8e8e8">
                <td style="padding:6px 12px;border:1px solid #ccc;font-weight:bold">Total Invoices</td>
                <td style="padding:6px 12px;border:1px solid #ccc;text-align:right;font-weight:bold">${billsData.length}</td>
            </tr>
            <tr>
                <td style="padding:6px 12px;border:1px solid #ccc;font-weight:bold">Total Crates</td>
                <td style="padding:6px 12px;border:1px solid #ccc;text-align:right">${grandCrates}</td>
            </tr>
            <tr>
                <td style="padding:6px 12px;border:1px solid #ccc;font-weight:bold">Sub Total</td>
                <td style="padding:6px 12px;border:1px solid #ccc;text-align:right">${fmtN(grandSubTotal)}</td>
            </tr>
            <tr>
                <td style="padding:6px 12px;border:1px solid #ccc;font-weight:bold">CGST</td>
                <td style="padding:6px 12px;border:1px solid #ccc;text-align:right">${fmtN(grandCgst)}</td>
            </tr>
            <tr>
                <td style="padding:6px 12px;border:1px solid #ccc;font-weight:bold">SGST</td>
                <td style="padding:6px 12px;border:1px solid #ccc;text-align:right">${fmtN(grandSgst)}</td>
            </tr>
            <tr style="border-top:2px solid #000;background:#f0f0f0">
                <td style="padding:8px 12px;border:1px solid #ccc;font-weight:bold;font-size:15px">Net Grand Total</td>
                <td style="padding:8px 12px;border:1px solid #ccc;text-align:right;font-weight:bold;font-size:15px">${fmtN(grandNet)}</td>
            </tr>
        </table>
        <div style="text-align:center;font-weight:bold;font-size:18px;border-top:2px solid #000;padding-top:8px;margin-top:10px">
            RS. ${Number(grandNet).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </div>
    </div>
    <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

            const win = window.open('', '_blank');
            win.document.write(html);
            win.document.close();
        } catch (err) {
            console.error('Report generation failed', err);
            alert('Failed to generate report. Please try again.');
        } finally {
            setReportLoading(false);
        }
    };

    // ── Print ──────────────────────────────────────────────────────────────────
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

    // ── Stock filter ───────────────────────────────────────────────────────────
    if (!Array.isArray(stockProducts)) {
        console.warn("Filter warning: 'stockProducts' is not an array in Purchases.jsx. Type:", typeof stockProducts, "Value:", stockProducts);
    }
    const stockList = Array.isArray(stockProducts) ? stockProducts : [];

    const allStock = stockList.filter(p =>
        !stockSearch || p.name?.toLowerCase().includes(stockSearch.toLowerCase()) || p.sku?.toLowerCase().includes(stockSearch.toLowerCase())
    );
    const filteredStock = stockFilter === 'all' ? allStock
        : stockFilter === 'in' ? allStock.filter(p => p.stockQuantity > 50)
            : stockFilter === 'low' ? allStock.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 50)
                : allStock.filter(p => p.stockQuantity <= 0);

    const inStock = allStock.filter(p => p.stockQuantity > 50).length;
    const lowStock = allStock.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 50).length;
    const outOfStock = allStock.filter(p => p.stockQuantity <= 0).length;
    const totalBottles = allStock.reduce((s, p) => s + (Number(p.stockQuantity) || 0), 0);

    // ════════════════════════════════════════════════════════════════════════════
    // CREATE FORM VIEW
    // ════════════════════════════════════════════════════════════════════════════
    if (showCreate) {
        return (
            <div className="animate-fade-in-up -mx-6 -mt-6 min-h-screen bg-slate-50 flex flex-col">
                {/* Sticky Top Bar */}
                <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-semibold text-sm transition-colors"
                        >
                            <ArrowLeft size={16} /> Back to Bills
                        </button>
                        <div className="w-px h-5 bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 rounded-lg">
                                <FileText size={14} className="text-indigo-600" />
                            </div>
                            <span className="font-bold text-slate-800 text-sm">New Purchase Bill</span>
                            {form.supplierName && (
                                <span className="text-slate-400 text-sm">— {form.supplierName}</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-60"
                    >
                        {saving ? <LoadingSpinner size="sm" /> : <Plus size={16} />}
                        Save Purchase Bill
                    </button>
                </div>

                <div className="flex flex-1 gap-0">
                    {/* ── Left: Main Form ── */}
                    <div className="flex-1 px-8 py-8 space-y-8 overflow-auto">

                        {/* Bill Header */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                                <Building2 size={12} className="text-indigo-400" /> Supplier &amp; Invoice Details
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        <Calendar size={11} className="text-indigo-400" /> Bill Date
                                    </label>
                                    <input type="date" value={form.billDate}
                                        onChange={e => setForm(f => ({ ...f, billDate: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none hover:border-slate-300 transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        <Hash size={11} className="text-indigo-400" /> Supplier Invoice No
                                    </label>
                                    <input type="text" placeholder="e.g. 000185" value={form.invoiceNo}
                                        onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none hover:border-slate-300 transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        <Building2 size={11} className="text-indigo-400" /> Supplier Name
                                    </label>
                                    <input type="text" placeholder="e.g. SHARANG TRADERS" value={form.supplierName}
                                        onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none hover:border-slate-300 transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Layers size={12} className="text-indigo-400" /> Purchase Items
                                </p>
                                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                                    {items.filter(i => i.description).length} item(s)
                                </span>
                            </div>

                            {/* Column headers */}
                            <div className="grid text-[10px] font-bold uppercase tracking-wider text-slate-400 px-5 py-3 bg-slate-50 border-b border-slate-100"
                                style={{ gridTemplateColumns: '28px 1fr 190px 88px 120px 108px 32px' }}>
                                <div className="text-center">#</div>
                                <div>Description</div>
                                <div>Link to Product</div>
                                <div className="text-center">Crates</div>
                                <div className="text-center">Rate / Crate</div>
                                <div className="text-right">Amount</div>
                                <div></div>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-slate-50">
                                {items.map((item, idx) => {
                                    const bpc = item._bpc || 1;
                                    const bottles = (Number(item.quantity) || 0) * bpc;
                                    return (
                                        <div key={idx}
                                            className={`grid items-center gap-2 px-4 py-3 hover:bg-indigo-50/20 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                                            style={{ gridTemplateColumns: '28px 1fr 190px 88px 120px 108px 32px' }}>
                                            <div className="text-center text-xs text-slate-300 font-bold">{idx + 1}</div>
                                            <div>
                                                <input type="text" value={item.description}
                                                    onChange={e => updateItem(idx, 'description', e.target.value)}
                                                    placeholder="Product name..."
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
                                            </div>
                                            <div>
                                                <select value={item.productId}
                                                    onChange={e => updateItem(idx, 'productId', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-300 outline-none">
                                                    <option value="">— None —</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <input type="number" min="1" value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-300 outline-none" />
                                                {bottles > 0 && (
                                                    <div className="text-center text-[10px] text-violet-500 font-bold mt-0.5">{bottles} btls</div>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs font-semibold">₹</span>
                                                <input type="number" min="0" step="0.01" value={item.rate}
                                                    onChange={e => updateItem(idx, 'rate', e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full pl-6 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-300 outline-none" />
                                            </div>
                                            <div className="text-right pr-1">
                                                {item.amount > 0
                                                    ? <span className="font-bold text-slate-800 text-sm">₹{fmt(item.amount)}</span>
                                                    : <span className="text-slate-200 text-lg">—</span>}
                                            </div>
                                            <div className="flex justify-center">
                                                {items.length > 1 && (
                                                    <button onClick={() => removeItem(idx)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors">
                                                        <X size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add Row */}
                            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                                <button onClick={addItem}
                                    className="flex items-center gap-2 text-indigo-500 hover:text-indigo-700 font-semibold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-indigo-50">
                                    <Plus size={15} /> Add another item
                                </button>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                                Notes <span className="text-slate-300 font-normal normal-case tracking-normal">(optional)</span>
                            </label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                rows={3} placeholder="Any remarks about this purchase bill..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none" />
                        </div>
                    </div>

                    {/* ── Right: Sticky Summary Panel ── */}
                    <div className="w-72 shrink-0 border-l border-slate-200 bg-white px-6 py-8 space-y-6 sticky top-14 self-start">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Bill Summary</p>

                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span>Total Items</span>
                                <span className="font-bold text-slate-700">{items.filter(i => i.description).length}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span>Total Crates</span>
                                <span className="font-bold text-slate-700">{totalCrates}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 border-t border-slate-100 pt-2.5">
                                <span>Sub Total</span>
                                <span className="font-bold text-slate-800">₹{fmt(subTotal)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Tax &amp; Adjustments</p>
                            {[
                                { key: 'cgstAmount', label: 'CGST' },
                                { key: 'sgstAmount', label: 'SGST' },
                                { key: 'roundOff', label: 'Round Off' },
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-center gap-3">
                                    <label className="text-xs font-semibold text-slate-500 w-20 shrink-0">{label} ₹</label>
                                    <input type="number" step="0.01" value={form[key]}
                                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                        placeholder="0.00"
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 outline-none text-right bg-slate-50" />
                                </div>
                            ))}
                        </div>

                        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white">
                            <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Net Total</p>
                            <p className="text-4xl font-black tracking-tight">₹{fmt(netTotal)}</p>
                            <div className="mt-3 pt-3 border-t border-white/20 space-y-1 text-xs opacity-75">
                                <div className="flex justify-between"><span>Sub Total</span><span>₹{fmt(subTotal)}</span></div>
                                <div className="flex justify-between"><span>GST</span><span>₹{fmt(cgst + sgst)}</span></div>
                                {ro !== 0 && <div className="flex justify-between"><span>Round Off</span><span>₹{fmt(ro)}</span></div>}
                            </div>
                        </div>

                        <button onClick={handleSubmit} disabled={saving}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-60">
                            {saving ? <LoadingSpinner size="sm" /> : <Plus size={17} />}
                            Save Purchase Bill
                        </button>
                        <button onClick={() => setShowCreate(false)}
                            className="w-full py-2.5 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════════════════
    // MAIN VIEW
    // ════════════════════════════════════════════════════════════════════════════
    return (
        <div className="animate-fade-in-up space-y-6">

            {/* ── Hero Header ── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-7 text-white shadow-2xl shadow-indigo-200">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }} />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm">
                            <Truck size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight">Purchases &amp; Stock</h1>
                            <p className="text-indigo-200 text-sm mt-0.5">Supplier invoices · purchase billing · live stock levels</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setShowCreate(true); resetForm(); }}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-all active:scale-95 text-sm whitespace-nowrap"
                    >
                        <Plus size={18} /> New Purchase Bill
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
                {[
                    { key: 'bills', label: 'Purchase Bills', icon: ClipboardList },
                    { key: 'stock', label: 'Current Stock', icon: BarChart2 },
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-6 py-2.5 font-semibold text-sm rounded-xl transition-all ${activeTab === key
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'}`}>
                        <Icon size={16} />{label}
                        {key === 'bills' && total > 0 && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                {total}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ════ BILLS TAB ════ */}
            {activeTab === 'bills' && (
                <div className="space-y-4">
                    {/* Search + Report Row */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search size={15} className="absolute left-4 top-3.5 text-slate-400" />
                            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search bill no, supplier, invoice..."
                                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm bg-white shadow-sm" />
                        </div>

                        {/* InvoiceWise Report Generator */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white border border-indigo-100 rounded-2xl px-4 py-3 shadow-sm w-full lg:w-auto">
                            <div className="flex items-center gap-1.5">
                                <FileText size={14} className="text-indigo-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Invoice Report</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                                    <Calendar size={12} className="text-slate-400" />
                                    <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                                        className="bg-transparent border-none text-xs font-medium text-slate-700 focus:ring-0 outline-none w-28" />
                                </div>
                                <span className="text-slate-400 font-bold text-xs">→</span>
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                                    <Calendar size={12} className="text-slate-400" />
                                    <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                                        className="bg-transparent border-none text-xs font-medium text-slate-700 focus:ring-0 outline-none w-28" />
                                </div>
                                <button
                                    onClick={generateReport}
                                    disabled={reportLoading}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap"
                                >
                                    {reportLoading ? <span className="animate-spin">⟳</span> : <Printer size={13} />}
                                    Print Report
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 flex justify-center"><LoadingSpinner /></div>
                    ) : bills.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-24 flex flex-col items-center gap-4 text-center">
                            <div className="p-5 bg-indigo-50 rounded-full">
                                <ShoppingBag size={40} className="text-indigo-300" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 text-lg">No purchase bills yet</p>
                                <p className="text-slate-400 text-sm mt-1">Create your first bill to start tracking supplier invoices</p>
                            </div>
                            <button onClick={() => { setShowCreate(true); resetForm(); }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                                <Plus size={16} /> Create First Bill
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Bills List */}
                            <div className="space-y-3">
                                {bills.map((bill) => (
                                    <div key={bill.id}
                                        className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-5 flex items-center gap-5 group">
                                        {/* Bill No Badge */}
                                        <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex flex-col items-center justify-center">
                                            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Bill</span>
                                            <span className="text-sm font-black text-indigo-700 leading-none">{bill.billNo?.split('-').pop() || bill.billNo}</span>
                                        </div>

                                        {/* Main Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-800 text-base truncate">{bill.supplierName}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} /> {toDate(bill.billDate)}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="flex items-center gap-1 font-mono">
                                                    <Hash size={11} /> {bill.invoiceNo}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span className="font-semibold text-indigo-500">{bill.billNo}</span>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-slate-400 mb-0.5">Net Total</p>
                                            <p className="text-xl font-extrabold text-emerald-600">₹{fmt(bill.netTotal)}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openView(bill.id)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors">
                                                <Eye size={13} /> View
                                            </button>
                                            <button onClick={() => deleteBill(bill.id, bill.billNo)}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors">
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {total > 25 && (
                                <div className="flex justify-between items-center text-sm bg-white rounded-2xl border border-slate-100 px-5 py-3 shadow-sm">
                                    <span className="text-slate-400 font-medium">{total} total bills</span>
                                    <div className="flex items-center gap-2">
                                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                            className="p-2 rounded-xl border disabled:opacity-30 hover:bg-slate-50 transition-colors">
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm">
                                            {page} / {Math.ceil(total / 25)}
                                        </span>
                                        <button disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)}
                                            className="p-2 rounded-xl border disabled:opacity-30 hover:bg-slate-50 transition-colors">
                                            <ChevRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ════ STOCK TAB ════ */}
            {activeTab === 'stock' && (
                <div className="space-y-5">
                    {/* Overview cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            {
                                label: 'Total Bottles', value: fmt0(totalBottles),
                                icon: Box, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600',
                                sub: 'across all products',
                            },
                            {
                                label: 'In Stock', value: inStock,
                                icon: CheckCircle, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600',
                                sub: `qty > 50 bottles`,
                            },
                            {
                                label: 'Low Stock', value: lowStock,
                                icon: AlertTriangle, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600',
                                sub: `qty ≤ 50 bottles`,
                            },
                            {
                                label: 'Out of Stock', value: outOfStock,
                                icon: Package, color: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-600',
                                sub: `qty = 0`,
                            },
                        ].map(({ label, value, icon: Icon, bg, text, sub }) => (
                            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
                                <div className={`p-2.5 rounded-xl ${bg}`}>
                                    <Icon size={20} className={text} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                                    <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search + Filter row */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="relative w-full max-w-sm">
                            <Search size={15} className="absolute left-4 top-3.5 text-slate-400" />
                            <input value={stockSearch} onChange={e => setStockSearch(e.target.value)}
                                placeholder="Search product or SKU..."
                                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none text-sm bg-white shadow-sm" />
                        </div>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'in', label: 'In Stock' },
                                { key: 'low', label: 'Low' },
                                { key: 'out', label: 'Out' },
                            ].map(({ key, label }) => (
                                <button key={key} onClick={() => setStockFilter(key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${stockFilter === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stock table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                                        <th className="px-6 py-4 text-left font-semibold">Product</th>
                                        <th className="px-6 py-4 text-left font-semibold">SKU</th>
                                        <th className="px-6 py-4 text-left font-semibold">Group</th>
                                        <th className="px-6 py-4 text-center font-semibold">Btls / Crate</th>
                                        <th className="px-6 py-4 text-center font-semibold">Stock (Bottles)</th>
                                        <th className="px-6 py-4 text-center font-semibold">≈ Crates</th>
                                        <th className="px-6 py-4 text-center font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm">
                                    {filteredStock.length === 0 && (
                                        <tr><td colSpan={7} className="py-16 text-center text-slate-400">No products found</td></tr>
                                    )}
                                    {filteredStock.map((p) => {
                                        const bpc = p.bottlesPerCrate || 1;
                                        const crates = Math.floor(p.stockQuantity / bpc);
                                        const stockStatus = p.stockQuantity <= 0 ? 'out'
                                            : p.stockQuantity <= 50 ? 'low' : 'in';
                                        return (
                                            <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-slate-800">{p.name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{p.sku || '—'}</td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">{p.groupName || '—'}</td>
                                                <td className="px-6 py-4 text-center text-slate-600 font-mono">{bpc}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-extrabold text-lg ${stockStatus === 'in' ? 'text-emerald-600' : stockStatus === 'low' ? 'text-amber-600' : 'text-red-500'}`}>
                                                        {p.stockQuantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-500 text-sm">≈ {crates}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {stockStatus === 'out'
                                                        ? <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[11px] font-bold">
                                                            <X size={10} /> Out of Stock
                                                        </span>
                                                        : stockStatus === 'low'
                                                            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[11px] font-bold">
                                                                <AlertTriangle size={10} /> Low Stock
                                                            </span>
                                                            : <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-bold">
                                                                <CheckCircle size={10} /> In Stock
                                                            </span>
                                                    }
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

            {/* ════ VIEW/PRINT MODAL ════ */}
            {(viewBill || viewLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-auto overflow-hidden">
                        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100">
                            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 rounded-lg"><FileText size={16} className="text-indigo-600" /></div>
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
