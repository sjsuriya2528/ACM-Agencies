import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import {
    ArrowLeft,
    Package,
    FileText,
    CreditCard,
    MapPin,
    Phone,
    User,
    Calendar,
    ChevronRight,
    CheckCircle,
    Clock,
    Truck,
    XCircle,
    MoreHorizontal
} from 'lucide-react';

const RetailerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [retailer, setRetailer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'payments'

    const fetchRetailerDetails = async () => {
        try {
            const response = await api.get(`/retailers/${id}`);
            setRetailer(response.data);
        } catch (error) {
            console.error("Failed to fetch retailer details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRetailerDetails();
    }, [id]);

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
                    .header { text-align: center; border-bottom: 2px solid black; padding: 10px; }
                    .company-name { font-size: 24px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
                    .address-line { font-size: 11px; font-weight: 600; }
                    .gst-box { margin-top: 8px; font-size: 11px; font-weight: 700; }
                    .details-grid { display: flex; border-bottom: 2px solid black; }
                    .col-left { width: 50%; padding: 8px; border-right: 2px solid black; }
                    .col-right { width: 50%; display: flex; flex-direction: column; }
                    .col-right-top { flex: 1; padding: 8px; }
                    .row { display: flex; margin-bottom: 4px; }
                    .label { font-weight: 700; width: 80px; }
                    .value { font-weight: 600; text-transform: uppercase; flex: 1; }
                    .gst-invoice-badge { text-align: center; background: #f3f4f6; padding: 4px; font-weight: 700; border-top: 2px solid black; }
                    table { width: 100%; border-collapse: collapse; }
                    th { border-bottom: 2px solid black; border-right: 2px solid black; padding: 4px; background-color: transparent; text-align: center; font-weight: bold; }
                    th:last-child { border-right: none; }
                    td { border-bottom: 1px solid black; border-right: 2px solid black; padding: 4px; }
                    td:last-child { border-right: none; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: 700; }
                    .footer-section { border-top: 2px solid black; }
                    .total-row { display: flex; font-weight: 700; border-bottom: 2px solid black; }
                    .total-label { flex: 1; text-align: right; padding: 4px; border-right: 2px solid black; }
                    .total-qty { width: 48px; text-align: center; padding: 4px; border-right: 2px solid black; }
                    .total-val { width: 80px; text-align: right; padding: 4px; }
                    .summary-grid { display: flex; height: 128px; }
                    .tax-box { flex: 1; border-right: 2px solid black; padding: 4px; display: flex; flex-direction: column; justify-content: space-between; }
                    .amounts-box { width: 192px; padding: 4px; display: flex; flex-direction: column; justify-content: flex-end; }
                    .tax-table { width: 100%; font-size: 10px; text-align: center; }
                    .tax-table th { border-bottom: 1px solid #ccc; font-weight: normal; }
                    .words { font-weight: 700; text-transform: capitalize; border-top: 2px solid black; padding-top: 4px; margin-top: 4px; }
                    .signatures { display: flex; justify-content: space-between; align-items: flex-end; padding: 16px; padding-top: 48px; border-top: 2px solid black; height: 96px; box-sizing: border-box; } 
                    .sig-block { text-align: center; font-weight: 700; font-size: 10px; }
                    .sig-line { border-top: 1px solid black; padding-top: 4px; padding-left: 16px; padding-right: 16px; display: inline-block; }
                    @media print { body { padding: 0; } }
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
                                <div class="row"><span class="label">Buyer Name</span><span class="value">: ${order.retailer?.shopName || retailer.shopName}</span></div>
                                <div class="row"><span class="label">Address</span><span class="value">: ${order.retailer?.address || retailer.address}</span></div>
                                <div class="row"><span class="label">Mobile</span><span class="value">: ${order.retailer?.phone || retailer.phone || ''}</span></div>
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
                                                <td>${vals.sgst.toFixed(2)}</td>
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
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Requested': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Dispatched': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Delivered': return 'bg-violet-100 text-violet-700 border-violet-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle size={14} />;
            case 'Requested': return <Clock size={14} />;
            case 'Dispatched': return <Truck size={14} />;
            case 'Delivered': return <Package size={14} />;
            case 'Rejected': return <XCircle size={14} />;
            default: return null;
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!retailer) return <div className="p-8 text-center text-gray-500">Retailer not found</div>;

    // Collect all payments from all invoices
    const allPayments = retailer.orders
        ?.filter(o => o.Invoice)
        .flatMap(o => o.Invoice.Payments?.map(p => ({ ...p, orderId: o.id, invoiceNumber: o.Invoice.invoiceNumber })) || [])
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)) || [];

    return (
        <div className="p-2 md:p-6 max-w-7xl mx-auto animate-fade-in-up">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/retailers')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">{retailer.shopName}</h1>
                        <p className="text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <MapPin size={14} /> {retailer.address || 'No address provided'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credit Balance</span>
                        <span className="text-xl font-black text-rose-600">₹{parseFloat(retailer.creditBalance || 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                <User size={20} />
                            </div>
                            <h2 className="font-bold text-gray-800">Contact Details</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-gray-400"><User size={16} /></div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Owner Name</p>
                                    <p className="text-gray-700 font-semibold">{retailer.ownerName || 'Not specified'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-gray-400"><Phone size={16} /></div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Phone Number</p>
                                    <p className="text-gray-700 font-semibold">{retailer.phone || 'Not specified'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 text-gray-400"><FileText size={16} /></div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">GSTIN</p>
                                    <p className="text-gray-700 font-semibold uppercase">{retailer.gstin || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-purple-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Package size={20} />
                            </div>
                            <h3 className="font-bold">Quick Stats</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-purple-100 text-sm">Total Orders</span>
                                <span className="font-bold text-lg">{retailer.orders?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-purple-100 text-sm">Active Invoices</span>
                                <span className="font-bold text-lg">
                                    {retailer.orders?.filter(o => o.Invoice && o.Invoice.paymentStatus !== 'Paid').length || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Order History
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'payments' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Payment History
                        </button>
                    </div>

                    {activeTab === 'orders' ? (
                        <div className="space-y-4">
                            {retailer.orders?.length > 0 ? (
                                retailer.orders.map(order => (
                                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                        <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                                    #{order.id}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">₹{parseFloat(order.totalAmount).toLocaleString()}</p>
                                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1.5 ${getStatusStyle(order.status)}`}>
                                                    {getStatusIcon(order.status)} {order.status}
                                                </span>
                                                <button
                                                    onClick={() => handleViewBill(order)}
                                                    className="ml-auto sm:ml-0 flex items-center gap-1.5 text-purple-600 hover:text-purple-700 font-bold text-xs"
                                                >
                                                    <FileText size={14} /> View Bill
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50/50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <User size={14} className="text-gray-400" />
                                                Sales Rep: <span className="font-semibold text-gray-700">{order.salesRep?.name}</span>
                                            </div>
                                            {order.Invoice && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <CreditCard size={14} className="text-gray-400" />
                                                    Payment: <span className={`font-semibold ${order.Invoice.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{order.Invoice.paymentStatus}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-dashed border-gray-200">
                                    No orders found for this retailer.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {allPayments.length > 0 ? (
                                allPayments.map(payment => (
                                    <div key={payment.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                                                ₹
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-800">₹{parseFloat(payment.amount).toLocaleString()}</p>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">
                                                    Invoice: {payment.invoiceNumber}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end gap-1">
                                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                                <Calendar size={12} /> {new Date(payment.paymentDate).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Mode: <span className="font-bold text-gray-600">{payment.paymentMode}</span>
                                                <span className="mx-2">|</span>
                                                By: <span className="font-bold text-gray-600">{payment.collectedBy?.name}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-dashed border-gray-200">
                                    No payment history found.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RetailerDetail;
