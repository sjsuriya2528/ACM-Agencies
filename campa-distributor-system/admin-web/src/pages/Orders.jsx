import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    Truck,
    MapPin,
    Package,
    User,
    Calendar,
    IndianRupee,
    MoreVertical,
    Trash2
} from 'lucide-react';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All'); // 'All', 'Cash', 'Credit'
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [assigningOrder, setAssigningOrder] = useState(null); // ID of order being assigned

    // Create Order State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [retailers, setRetailers] = useState([]);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({}); // { productId: totalPieces }
    const [selectedRetailer, setSelectedRetailer] = useState(null);
    const [retailerSearchTerm, setRetailerSearchTerm] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [paymentMode, setPaymentMode] = useState('Credit');

    // New Retailer State
    const [showNewRetailerForm, setShowNewRetailerForm] = useState(false);
    const [newRetailer, setNewRetailer] = useState({
        shopName: '',
        ownerName: '',
        phone: '',
        address: ''
    });

    const handleCreateRetailer = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/retailers', newRetailer);
            setRetailers([...retailers, res.data]);
            setSelectedRetailer(res.data);
            setShowNewRetailerForm(false);
            setNewRetailer({ shopName: '', ownerName: '', phone: '', address: '' });
            alert("Retailer created successfully!");
        } catch (error) {
            console.error("Failed to create retailer", error);
            alert(error.response?.data?.message || "Failed to create retailer");
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchDrivers();
        fetchCreateOrderData();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders');
            setOrders(response.data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDrivers = async () => {
        try {
            const response = await api.get('/users');
            setDrivers(response.data.filter(u => u.role === 'driver'));
        } catch (error) {
            console.error("Failed to fetch drivers", error);
        }
    };

    const fetchCreateOrderData = async () => {
        try {
            const [retailersRes, productsRes] = await Promise.all([
                api.get('/retailers'),
                api.get('/products')
            ]);
            setRetailers(retailersRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            console.error("Failed to fetch data for create order", error);
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this order?`)) return;

        try {
            await api.put(`/orders/${orderId}/status`, { status });
            // Refresh orders to get updated invoice status if approved
            fetchOrders();
        } catch (error) {
            console.error(`Failed to ${status} order`, error);
            alert(error.response?.data?.message || "Failed to update order status");
        }
    };

    const handleAssignDriver = async (orderId, driverId) => {
        if (!driverId) return;
        try {
            await api.put(`/orders/${orderId}/assign`, { driverId });
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'Dispatched', driverId: parseInt(driverId) } : o));
            setAssigningOrder(null);
        } catch (error) {
            console.error("Failed to assign driver", error);
            alert("Failed to assign driver");
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("CRITICAL WARNING: This will PERMANENTLY DELETE this order, revert stock, and reset the database sequence.\n\nAre you sure you want to proceed?")) return;

        try {
            await api.delete(`/orders/${orderId}`);
            alert("Order cancelled and deleted successfully.");
            fetchOrders();
        } catch (error) {
            console.error("Failed to delete order", error);
            alert(error.response?.data?.message || "Failed to delete order");
        }
    };

    // Create Order Functions
    const filteredRetailers = retailers.filter(r =>
        r.shopName.toLowerCase().includes(retailerSearchTerm.toLowerCase()) ||
        (r.ownerName && r.ownerName.toLowerCase().includes(retailerSearchTerm.toLowerCase()))
    );

    const handleQuantityChange = (productId, type, value) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const bottlesPerCrate = product.bottlesPerCrate || 24;
        const currentTotal = cart[productId] || 0;

        let currentCrates = Math.floor(currentTotal / bottlesPerCrate);
        let currentPieces = currentTotal % bottlesPerCrate;

        if (type === 'crates') {
            currentCrates = parseInt(value) || 0;
        } else if (type === 'pieces') {
            currentPieces = parseInt(value) || 0;
        }

        const newTotal = (currentCrates * bottlesPerCrate) + currentPieces;

        setCart(prev => {
            if (newTotal <= 0) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: newTotal };
        });
    };

    const calculateTotal = () => {
        return Object.entries(cart).reduce((total, [productId, qty]) => {
            const product = products.find(p => p.id === parseInt(productId));
            return total + (product ? product.price * qty : 0);
        }, 0);
    };

    const handleCreateOrderSubmit = async () => {
        if (!selectedRetailer) return alert("Please select a retailer");
        const itemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
        if (itemsCount === 0) return alert("Cart is empty");

        const orderItems = Object.entries(cart).map(([productId, quantity]) => ({
            productId: parseInt(productId),
            quantity
        }));

        try {
            await api.post('/orders', {
                retailerId: selectedRetailer.id,
                items: orderItems,
                totalAmount: calculateTotal(),
                paymentMode,
                status: 'Approved' // Admin created orders are automatically approved
            });
            alert("Order placed successfully!");
            setShowCreateModal(false);
            setCart({});
            setSelectedRetailer(null);
            fetchOrders(); // Refresh list
        } catch (error) {
            console.error("Order failed", error);
            alert("Failed to place order");
        }
    };

    const handleViewBill = (order) => {
        // Helper: Number to Words
        const numberToWords = (num) => {
            const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
            const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
            if ((num = num.toString()).length > 9) return 'overflow';
            const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return; var str = '';
            str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
            str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
            str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
            str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
            str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
            return str.trim();
        };

        // Calculations
        const totalAmount = parseFloat(order.totalAmount || 0);
        const roundOff = (Math.round(totalAmount) - totalAmount).toFixed(2);
        const netTotal = Math.round(totalAmount);

        const taxSummary = {};
        let totalTaxableValue = 0;
        let totalGSTValue = 0;
        let totalQty = 0;

        const enrichedItems = order.items.map(item => {
            const qty = item.quantity;
            totalQty += qty;
            const total = parseFloat(item.totalPrice);
            const gstRate = parseFloat(item.Product?.gstPercentage || 18);

            const taxableValue = total / (1 + (gstRate / 100));
            const gstAmount = total - taxableValue;
            const taxableRate = taxableValue / qty;

            if (!taxSummary[gstRate]) taxSummary[gstRate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
            taxSummary[gstRate].taxable += taxableValue;
            taxSummary[gstRate].cgst += gstAmount / 2;
            taxSummary[gstRate].sgst += gstAmount / 2;

            totalTaxableValue += taxableValue;
            totalGSTValue += gstAmount;

            return {
                ...item,
                hsn: item.Product?.hsnCode || '',
                gstRate,
                taxableRate,
                taxableValue,
                totalPrice: total
            };
        });

        // HTML Content
        const invoiceContent = `
            <html>
            <head>
                <title>Invoice #${order.Invoice?.invoiceNumber || order.id}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    body { font-family: 'Inter', sans-serif; color: black; margin: 0; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 12px; }
                    
                    .container { max-width: 210mm; margin: 0 auto; border: 2px solid black; min-height: 225mm; display: flex; flex-direction: column; justify-content: space-between; }
                    
                    /* Header */
                    .header { text-align: center; border-bottom: 2px solid black; padding: 10px; }
                    .company-name { font-size: 24px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
                    .address-line { font-size: 11px; font-weight: 600; }
                    .gst-box { margin-top: 8px; font-size: 11px; font-weight: 700; }

                    /* Details Grid */
                    .details-grid { display: flex; border-bottom: 2px solid black; }
                    .col-left { width: 50%; padding: 8px; border-right: 2px solid black; }
                    .col-right { width: 50%; display: flex; flex-direction: column; }
                    .col-right-top { flex: 1; padding: 8px; }
                    
                    .row { display: flex; margin-bottom: 4px; }
                    .label { font-weight: 700; width: 80px; }
                    .value { font-weight: 600; text-transform: uppercase; flex: 1; }
                    
                    .gst-invoice-badge { text-align: center; background: #f3f4f6; padding: 4px; font-weight: 700; border-top: 2px solid black; }

                    /* Table */
                    table { width: 100%; border-collapse: collapse; }
                    th { border-bottom: 2px solid black; border-right: 2px solid black; padding: 4px; background-color: transparent; text-align: center; font-weight: bold; }
                    th:last-child { border-right: none; }
                    td { border-bottom: 1px solid black; border-right: 2px solid black; padding: 4px; }
                    td:last-child { border-right: none; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: 700; }
                    
                    /* Footer */
                    .footer-section { border-top: 2px solid black; }
                    .total-row { display: flex; font-weight: 700; border-bottom: 2px solid black; }
                    .total-label { flex: 1; text-align: right; padding: 4px; border-right: 2px solid black; }
                    .total-qty { width: 48px; text-align: center; padding: 4px; border-right: 2px solid black; } /* w-12 = 48px */
                    .total-val { width: 80px; text-align: right; padding: 4px; } /* w-20 = 80px */

                    .summary-grid { display: flex; height: 128px; } /* h-32 = 128px */
                    .tax-box { flex: 1; border-right: 2px solid black; padding: 4px; display: flex; flex-direction: column; justify-content: space-between; }
                    .amounts-box { width: 192px; padding: 4px; display: flex; flex-direction: column; justify-content: flex-end; } /* w-48 = 192px */
                    
                    .tax-table { width: 100%; font-size: 10px; text-align: center; }
                    .tax-table th { border-bottom: 1px solid #ccc; font-weight: normal; }
                    .words { font-weight: 700; text-transform: capitalize; border-top: 2px solid black; padding-top: 4px; margin-top: 4px; }

                    /* pt-12 = 48px, h-24 = 96px */
                    .signatures { display: flex; justify-content: space-between; align-items: flex-end; padding: 16px; padding-top: 48px; border-top: 2px solid black; height: 96px; box-sizing: border-box; } 
                    .sig-block { text-align: center; font-weight: 700; font-size: 10px; }
                    .sig-line { border-top: 1px solid black; padding-top: 4px; padding-left: 16px; padding-right: 16px; display: inline-block; }

                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div>
                        <div class="header">
                            <div class="company-name">A.C.M AGENCIES</div>
                            <div class="address-line">9/141/D, SANKARANKOVIL MAIN ROAD</div>
                            <div class="address-line">RAMAYANPATTI, TIRUNELVELI - 627538</div>
                            <div class="gst-box">GSTIN: 33KFPP50618L1ZU &nbsp;|&nbsp; MOBILE: 9698511002, 9443333438</div>
                        </div>

                        <div class="details-grid">
                            <div class="col-left">
                                <div class="row"><span class="label">Buyer Name</span><span class="value">: ${order.retailer?.shopName || 'Unknown'}</span></div>
                                <div class="row"><span class="label">Address</span><span class="value">: ${order.retailer?.address || 'No Address'}</span></div>
                                <div class="row"><span class="label">Mobile</span><span class="value">: ${order.retailer?.phone || ''}</span></div>
                                <div class="row"><span class="label">Cust GSTin</span><span class="value">: ${order.retailer?.gstin || ''}</span></div>
                            </div>
                            <div class="col-right">
                                <div class="col-right-top">
                                    <div class="row"><span class="label">Invoice No</span><span class="value">: ${order.Invoice?.invoiceNumber || order.id}</span></div>
                                    <div class="row"><span class="label">Date</span><span class="value">: ${new Date(order.createdAt).toLocaleDateString('en-GB')}</span></div>
                                    <div class="row"><span class="label">Vehicle</span><span class="value">: </span></div>
                                </div>
                                <div class="gst-invoice-badge">GST INVOICE</div>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40px;">SNO</th>
                                    <th style="text-align: left;">DESCRIPTION</th>
                                    <th style="width: 60px;">HSN</th>
                                    <th style="width: 40px;">Qty</th>
                                    <th style="width: 70px; text-align: right;">RATE</th>
                                    <th style="width: 50px;">GST%</th>
                                    <th style="width: 80px; text-align: right;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${enrichedItems.map((item, idx) => `
                                    <tr>
                                        <td class="text-center">${idx + 1}</td>
                                        <td>${item.Product?.name || item.productName || 'Unknown'}</td>
                                        <td class="text-center">${item.hsn}</td>
                                        <td class="text-center">${item.quantity}</td>
                                        <td class="text-right">${item.taxableRate.toFixed(2)}</td>
                                        <td class="text-center">${item.gstRate}</td>
                                        <td class="text-right" style="font-weight: 700; font-size: 14px;">${item.totalPrice.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="footer-section">
                        <div class="total-row">
                            <div class="total-label">Total</div>
                            <div class="total-qty">${totalQty}</div>
                            <div class="total-val">${totalAmount.toFixed(2)}</div>
                        </div>

                        <div class="summary-grid">
                            <div class="tax-box">
                                <table class="tax-table">
                                    <thead>
                                        <tr>
                                            <th>GST%</th>
                                            <th>TAXABLE</th>
                                            <th>CGSTVAL</th>
                                            <th>SGSTVAL</th>
                                            <th>IGSTVAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Object.entries(taxSummary).map(([rate, vals]) => `
                                            <tr>
                                                <td>${rate}</td>
                                                <td>${vals.taxable.toFixed(2)}</td>
                                                <td>${vals.cgst.toFixed(2)}</td>
                                                <td>{vals.sgst.toFixed(2)}</td>
                                                <td>${vals.igst.toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                                <div class="words">${numberToWords(netTotal)} Rupees Only</div>
                            </div>
                            <div class="amounts-box">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                    <span class="font-bold">GST VALUE</span>
                                    <span>${totalGSTValue.toFixed(2)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                    <span class="font-bold">DISCOUNT</span>
                                    <span>0.00</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                    <span class="font-bold">ROUND OFF</span>
                                    <span>${roundOff}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 2px solid black; background-color: #f3f4f6;">
                                    <span class="font-bold" style="font-size: 16px;">NET TOTAL</span>
                                    <span class="font-bold" style="font-size: 18px;">${netTotal}</span>
                                </div>
                            </div>
                        </div>

                        <div class="signatures">
                            <div class="sig-block">Gpay No<br/>SURESH<br/>9698511002</div>
                            <div class="sig-block"><div class="sig-line">Customer Signature</div></div>
                            <div class="sig-block"><div class="sig-line">Authorised Signature</div></div>
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.retailer?.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.salesRep?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toString().includes(searchTerm);
        const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
        const matchesPayment = paymentFilter === 'All' || order.paymentMode === paymentFilter;
        return matchesSearch && matchesStatus && matchesPayment;
    });

    const getStatusBadge = (status) => {
        const styles = {
            'Approved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Rejected': 'bg-rose-100 text-rose-700 border-rose-200',
            'Requested': 'bg-amber-100 text-amber-700 border-amber-200',
            'Dispatched': 'bg-blue-100 text-blue-700 border-blue-200',
            'Delivered': 'bg-violet-100 text-violet-700 border-violet-200',
        };
        const icons = {
            'Approved': <CheckCircle size={14} />,
            'Rejected': <XCircle size={14} />,
            'Requested': <Clock size={14} />,
            'Dispatched': <Truck size={14} />,
            'Delivered': <Package size={14} />,
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-700'} shadow-sm`}>
                {icons[status]} {status}
            </span>
        );
    };

    if (loading) return (
        <div className="flex justify-center items-center h-full min-h-[400px]">
            <div className="w-10 h-10 rounded-full animate-spin border-4 border-solid border-blue-500 border-t-transparent shadow-lg"></div>
        </div>
    );

    return (
        <div className="animate-fade-in-up space-y-8 p-2">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Order Management</h1>
                    <p className="text-slate-500 mt-1">Track and manage retailer orders</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Package size={16} /> Create Order
                    </button>
                    <button
                        onClick={fetchOrders}
                        className="bg-white hover:bg-gray-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Clock size={16} /> Refresh
                    </button>
                </div>
            </header>

            {/* Filters & Search */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search Retailer, Sales Rep, or ID..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                    {/* Payment Mode Filter */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['All', 'Cash', 'Credit'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setPaymentFilter(mode)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${paymentFilter === mode ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        {['All', 'Requested', 'Approved', 'Dispatched', 'Delivered', 'Rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filterStatus === status
                                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20 scale-105'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-left">
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Retailer</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Sales Rep</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Mode</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                            <th className="p-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map(order => (
                                <React.Fragment key={order.id}>
                                    <tr
                                        className={`group hover:bg-slate-50/80 transition-all cursor-pointer ${expandedOrder === order.id ? 'bg-slate-50/50' : ''}`}
                                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                    >
                                        <td className="p-5">
                                            <span className="font-mono text-sm font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">#{order.id}</span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                                    {order.retailer?.shopName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{order.retailer?.shopName}</p>
                                                    <p className="text-xs text-slate-400 hidden group-hover:block transition-all">{order.retailer?.phone || 'No phone'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 text-sm text-slate-600 font-medium">{order.salesRep?.name}</td>
                                        <td className="p-5">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.paymentMode === 'Cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {order.paymentMode || 'Credit'}
                                            </span>
                                        </td>
                                        <td className="p-5 font-bold text-slate-800">
                                            ₹{Number(order.totalAmount).toLocaleString()}
                                        </td>
                                        <td className="p-5 text-center">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="p-5 text-right">
                                            <button className={`p-2 rounded-full hover:bg-slate-200 transition-colors ${expandedOrder === order.id ? 'bg-slate-200' : ''}`}>
                                                {expandedOrder === order.id ? <ChevronUp size={18} className="text-slate-600" /> : <ChevronDown size={18} className="text-slate-400" />}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expanded Detail View */}
                                    {expandedOrder === order.id && (
                                        <tr className="bg-slate-50/30">
                                            <td colSpan="7" className="p-6">
                                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-fade-in-up">

                                                    {/* Header Actions */}
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-100 gap-4">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                                <Package size={20} className="text-blue-500" /> Order Details
                                                            </h3>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {/* View Bill Action */}
                                                            {['Approved', 'Dispatched', 'Delivered'].includes(order.status) && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleViewBill(order); }}
                                                                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                                                >
                                                                    <IndianRupee size={16} /> View Bill
                                                                </button>
                                                            )}

                                                            {/* Action Buttons based on Status */}
                                                            {order.status === 'Requested' && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'Approved'); }}
                                                                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5"
                                                                    >
                                                                        <CheckCircle size={16} /> Approve Order
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'Rejected'); }}
                                                                        className="flex items-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-sm"
                                                                    >
                                                                        <XCircle size={16} /> Reject
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                                                                        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-sm"
                                                                        title="Permanently Delete"
                                                                    >
                                                                        <Trash2 size={16} /> Cancel
                                                                    </button>
                                                                </>
                                                            )}

                                                            {order.status === 'Approved' && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                                                        {assigningOrder === order.id ? (
                                                                            <>
                                                                                <select
                                                                                    className="bg-white border text-sm rounded-lg p-1.5 focus:ring-blue-500 focus:border-blue-500 min-w-[150px]"
                                                                                    onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                                                                                    defaultValue=""
                                                                                >
                                                                                    <option value="" disabled>Select Driver</option>
                                                                                    {drivers.map(d => (
                                                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                                                    ))}
                                                                                </select>
                                                                                <button onClick={() => setAssigningOrder(null)} className="p-1 hover:bg-slate-200 rounded">
                                                                                    <XCircle size={18} className="text-slate-500" />
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setAssigningOrder(order.id); }}
                                                                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-blue-200 transition-all"
                                                                            >
                                                                                <Truck size={16} /> Assign Driver
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                                                                        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-sm"
                                                                        title="Permanently Delete"
                                                                    >
                                                                        <Trash2 size={16} /> Cancel
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Items Grid */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                                        {order.items?.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                                                                <div>
                                                                    <p className="font-semibold text-slate-700">{item.productName || item.Product?.name || 'Unknown Product'}</p>
                                                                    <p className="text-xs text-slate-400 mt-1">
                                                                        ₹{item.pricePerUnit} × {item.quantity} units
                                                                    </p>
                                                                </div>
                                                                <p className="font-bold text-slate-800">₹{item.totalPrice}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Footer Metadata */}
                                                    <div className="flex flex-wrap gap-6 text-sm text-slate-500 pt-4 border-t border-slate-100">
                                                        {order.driverId && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                                                                    <Truck size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Driver</p>
                                                                    <p className="font-semibold text-slate-800">
                                                                        {drivers.find(d => d.id === order.driverId)?.name || 'Unknown'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {order.gpsLatitude && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                                                    <MapPin size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Location</p>
                                                                    <a
                                                                        href={`https://www.google.com/maps?q=${order.gpsLatitude},${order.gpsLongitude}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="font-semibold text-blue-600 hover:underline"
                                                                    >
                                                                        View Map
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Package size={48} className="mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No orders found</p>
                                        <p className="text-sm">Try adjusting your search or filters</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Order Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Package className="text-blue-600" size={24} /> Create New Order
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Retailer Selection */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
                                <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">Select Retailer</h3>

                                {selectedRetailer ? (
                                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                                {selectedRetailer.shopName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{selectedRetailer.shopName}</p>
                                                <p className="text-sm text-slate-500">{selectedRetailer.ownerName} • {selectedRetailer.phone}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedRetailer(null)} className="text-sm font-semibold text-blue-600 hover:underline">Change</button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="Search retailer by shop name or owner..."
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                                                    value={retailerSearchTerm}
                                                    onChange={(e) => setRetailerSearchTerm(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setShowNewRetailerForm(!showNewRetailerForm)}
                                                className={`px-4 rounded-xl font-bold transition-all border ${showNewRetailerForm ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                {showNewRetailerForm ? 'Cancel' : 'New Retailer'}
                                            </button>
                                        </div>

                                        {retailerSearchTerm && !showNewRetailerForm && (
                                            <div className="absolute top-14 left-0 right-0 bg-white shadow-xl rounded-xl border border-slate-100 z-10 max-h-60 overflow-y-auto">
                                                {filteredRetailers.map(r => (
                                                    <div
                                                        key={r.id}
                                                        onClick={() => { setSelectedRetailer(r); setRetailerSearchTerm(''); }}
                                                        className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                                    >
                                                        <p className="font-bold text-slate-800">{r.shopName}</p>
                                                        <p className="text-xs text-slate-500">{r.ownerName} • {r.address}</p>
                                                    </div>
                                                ))}
                                                {filteredRetailers.length === 0 && <div className="p-4 text-center text-slate-400 text-sm">No retailers found</div>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* New Retailer Form */}
                                {showNewRetailerForm && !selectedRetailer && (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in-up">
                                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <User size={16} className="text-blue-500" /> Add New Retailer
                                        </h4>
                                        <form onSubmit={handleCreateRetailer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Shop Name *"
                                                required
                                                className="p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={newRetailer.shopName}
                                                onChange={(e) => setNewRetailer({ ...newRetailer, shopName: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Owner Name"
                                                className="p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={newRetailer.ownerName}
                                                onChange={(e) => setNewRetailer({ ...newRetailer, ownerName: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Phone Number"
                                                className="p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={newRetailer.phone}
                                                onChange={(e) => setNewRetailer({ ...newRetailer, phone: e.target.value })}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Address"
                                                className="p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={newRetailer.address}
                                                onChange={(e) => setNewRetailer({ ...newRetailer, address: e.target.value })}
                                            />
                                            <button
                                                type="submit"
                                                className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-200"
                                            >
                                                Create & Select Retailer
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>

                            {/* Product Selection */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider px-1">Add Products</h3>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={productSearchTerm}
                                            onChange={(e) => setProductSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {products.filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase())).map(product => {
                                        const totalQty = cart[product.id] || 0;
                                        const bottlesPerCrate = product.bottlesPerCrate || 24;
                                        const crates = Math.floor(totalQty / bottlesPerCrate);
                                        const pieces = totalQty % bottlesPerCrate;

                                        return (
                                            <div key={product.id} className={`p-4 rounded-xl border transition-all ${totalQty > 0 ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800">{product.name}</h4>
                                                        <p className="text-xs text-slate-500">Price: ₹{product.price} | 1 Crate = {bottlesPerCrate}</p>
                                                    </div>
                                                    <div className="font-bold text-slate-800">
                                                        ₹{(totalQty * product.price).toFixed(2)}
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Crates</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="0"
                                                            value={crates || ''}
                                                            onChange={(e) => handleQuantityChange(product.id, 'crates', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Pieces</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={bottlesPerCrate - 1}
                                                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="0"
                                                            value={pieces || ''}
                                                            onChange={(e) => handleQuantityChange(product.id, 'pieces', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Payment Mode */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">Payment Mode</h3>
                                <div className="flex gap-4">
                                    {['Credit', 'Cash'].map(mode => (
                                        <label key={mode} className={`flex-1 cursor-pointer relative`}>
                                            <input
                                                type="radio"
                                                name="paymentMode"
                                                className="peer hidden"
                                                checked={paymentMode === mode}
                                                onChange={() => setPaymentMode(mode)}
                                            />
                                            <div className="p-4 rounded-xl border-2 border-slate-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all text-center">
                                                <span className={`font-bold ${paymentMode === mode ? 'text-blue-700' : 'text-slate-600'}`}>{mode}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Summary */}
                        <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="text-slate-500 text-xs font-bold uppercase">Total Amount</p>
                                <p className="text-3xl font-extrabold text-blue-600">₹{calculateTotal().toFixed(2)}</p>
                            </div>
                            <button
                                onClick={handleCreateOrderSubmit}
                                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                            >
                                Place Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
