import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Printer, FileText, Download, Share2, ShieldCheck, Mail, Phone, MapPin, IndianRupee } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

// Number to Words Utility
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

const InvoiceView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const response = await api.get(`/invoices/${id}`);
                setInvoice(response.data);
            } catch (error) {
                console.error("Failed to fetch invoice", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <LoadingSpinner />;

    if (!invoice) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-500 gap-4">
            <div className="p-6 bg-slate-50 rounded-[2rem]">
                <FileText size={48} className="text-slate-200" />
            </div>
            <p className="font-black text-xl tracking-tight text-slate-800">Invoice not found</p>
            <button onClick={() => navigate(-1)} className="text-blue-600 font-bold flex items-center gap-1 group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Head Back
            </button>
        </div>
    );

    const items = invoice.Order?.items || [];
    const totalAmount = parseFloat(invoice.netTotal || 0);
    const roundOff = (Math.round(totalAmount) - totalAmount).toFixed(2);
    const netTotal = Math.round(totalAmount);

    const taxSummary = {};
    let totalTaxableValue = 0;
    let totalGSTValue = 0;

    const enrichedItems = items.map(item => {
        const qty = item.quantity;
        const total = parseFloat(item.totalPrice);
        const gstRate = 40; // 40% Total (20% CGST + 20% SGST)

        const taxableValue = total / (1 + (gstRate / 100));
        const gstAmount = total - taxableValue;
        const taxableRate = taxableValue / qty;

        if (!taxSummary[gstRate]) {
            taxSummary[gstRate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        }
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
            taxableValue
        };
    });

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center">
            {/* Immersive Sticky Actions Bar */}
            <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between print:hidden shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-slate-50 rounded-2xl text-slate-600 hover:bg-white hover:shadow-md transition-all border border-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">Invoice Details</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Bill #{invoice.invoiceNumber || invoice.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {/* Implement Share logic */ }}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-[1.2rem] transition-all border border-transparent hover:border-blue-100"
                        title="Share Invoice"
                    >
                        <Share2 size={20} />
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-[1.2rem] font-black text-sm shadow-xl transition-all active:scale-95"
                    >
                        <Printer size={18} /> Print
                    </button>
                </div>
            </div>

            {/* Paper Container */}
            <div className="max-w-[210mm] w-full mx-auto my-8 md:my-12 print:my-0 px-4 md:px-0 transition-all duration-700 animate-fade-in-up">

                {/* Paper Representation */}
                <div className="bg-white shadow-2xl print:shadow-none p-8 md:p-12 print:p-0 min-h-[297mm] print:min-h-0 text-black font-inter relative rounded-b-[3rem] md:rounded-[3rem] border border-white">

                    {/* Watermark or Decorative Background element (Screen only) */}
                    <div className="absolute inset-0 bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-20 pointer-events-none print:hidden"></div>

                    {/* Standard Invoice Border */}
                    <div className="border-[2px] border-black min-h-[250mm] flex flex-col justify-between relative z-10 bg-white shadow-[0_0_0_8px_white]">

                        <div>
                            {/* Business Header */}
                            <div className="text-center border-b-[2px] border-black p-6">
                                <h2 className="text-2xl font-black uppercase mb-1 tracking-tighter">A.C.M AGENCIES</h2>
                                <p className="font-bold text-[10px] text-slate-600 uppercase tracking-widest">Beverage Distribution Specialist</p>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 px-10">
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                        <MapPin size={12} className="text-slate-300" /> Ramayanpatti, Tirunelveli
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                        <Phone size={12} className="text-slate-300" /> 96985 11002
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                        <ShieldCheck size={12} className="text-emerald-500" /> 33KFPP50618L1ZU
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="flex border-b-[2px] border-black">
                                {/* Left Column: Retailer */}
                                <div className="w-1/2 p-4 border-r-[2px] border-black bg-slate-50/20">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Bill To (Retailer)</p>
                                    <h3 className="font-extrabold text-slate-800 text-lg uppercase leading-tight mb-2 tracking-tighter">
                                        {invoice.customerName || invoice.Order?.retailer?.shopName}
                                    </h3>
                                    <div className="space-y-1.5 text-xs">
                                        <p className="flex items-start gap-2 text-slate-600 font-bold leading-relaxed">
                                            <MapPin size={12} className="text-slate-300 mt-0.5 shrink-0" /> {invoice.customerAddress || invoice.Order?.retailer?.address}
                                        </p>
                                        <p className="flex items-center gap-2 text-slate-600 font-bold">
                                            <Phone size={12} className="text-slate-300 shrink-0" /> {invoice.customerPhone || invoice.Order?.retailer?.phone}
                                        </p>
                                        <p className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase">
                                            <ShieldCheck size={12} className="text-slate-200 shrink-0" /> GSTIN: {invoice.Order?.retailer?.gstin || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Column: Invoice Details */}
                                <div className="w-1/2 flex flex-col">
                                    <div className="flex-1 p-4 bg-white">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-right">Invoice Metadata</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Ref #</span>
                                                <span className="text-xs font-black text-slate-800 tracking-wider">#{invoice.invoiceNumber || invoice.id}</span>
                                            </div>
                                            <div className="flex justify-between items-center px-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Dated</span>
                                                <span className="text-xs font-black text-slate-800">{new Date(invoice.createdAt).toLocaleDateString('en-GB')}</span>
                                            </div>
                                            <div className="flex justify-between items-center px-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Vehicle</span>
                                                <span className="text-xs font-black text-slate-800 italic">Scheduled Delivery</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t-[2px] border-black text-center py-2 font-black bg-slate-900 text-white text-xs tracking-[0.3em] uppercase">
                                        Tax Invoice
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <table className="w-full text-[11px] border-collapse bg-white">
                                <thead>
                                    <tr className="border-b-[2px] border-black text-center bg-slate-50/50">
                                        <th className="border-r-[2px] border-black w-10 py-3 uppercase tracking-widest font-black text-[9px]">S.No</th>
                                        <th className="border-r-[2px] border-black py-3 text-left px-4 uppercase tracking-widest font-black text-[9px]">Product Description</th>
                                        <th className="border-r-[2px] border-black w-16 py-3 uppercase tracking-widest font-black text-[9px]">HSN</th>
                                        <th className="border-r-[2px] border-black w-12 py-3 uppercase tracking-widest font-black text-[9px]">Qty</th>
                                        <th className="border-r-[2px] border-black w-20 py-3 uppercase tracking-widest font-black text-[9px]">Rate</th>
                                        <th className="border-r-[2px] border-black w-12 py-3 uppercase tracking-widest font-black text-[9px]">GST %</th>
                                        <th className="w-24 py-3 uppercase tracking-widest font-black text-[9px]">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/10">
                                    {enrichedItems.map((item, index) => (
                                        <tr key={index} className="border-b border-black">
                                            <td className="border-r-[2px] border-black text-center py-3 font-bold text-slate-400">{index + 1}</td>
                                            <td className="border-r-[2px] border-black px-4 py-3 font-black text-slate-800 uppercase tracking-tight">{item.Product?.name || 'Unknown Item'}</td>
                                            <td className="border-r-[2px] border-black text-center py-3 font-bold text-slate-600 tracking-wider">{item.hsn}</td>
                                            <td className="border-r-[2px] border-black text-center py-3 font-black text-slate-800">{item.quantity}</td>
                                            <td className="border-r-[2px] border-black text-right px-4 py-3 text-slate-600 font-bold">{item.taxableRate.toFixed(2)}</td>
                                            <td className="border-r-[2px] border-black text-center py-3 font-bold text-slate-600">{item.gstRate} %</td>
                                            <td className="text-right px-4 py-3 font-black text-sm text-slate-900">₹{parseFloat(item.totalPrice).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals & Tax */}
                        <div className="bg-slate-50/30">
                            {/* Summary Bar */}
                            <div className="border-t-[2px] border-black flex text-[10px] font-black uppercase tracking-widest bg-slate-50">
                                <div className="flex-1 border-r-[2px] border-black text-right px-4 py-3 text-slate-400">Net Totals</div>
                                <div className="w-12 border-r-[2px] border-black text-center py-3 text-slate-800">
                                    {items.reduce((acc, i) => acc + parseInt(i.quantity), 0)}
                                </div>
                                <div className="w-24 text-right px-4 py-3 text-slate-900 bg-emerald-50 font-black">
                                    ₹{totalAmount.toFixed(2)}
                                </div>
                            </div>

                            {/* Tax Section */}
                            <div className="border-t-[2px] border-black flex text-[9px] min-h-[120px]">
                                <div className="flex-1 border-r-[2px] border-black flex flex-col justify-between p-3">
                                    <table className="w-full text-center border-collapse">
                                        <thead>
                                            <tr className="border-b-[1px] border-black/20 text-slate-400">
                                                <th className="w-12 py-1 font-black">GST RATE</th>
                                                <th className="py-1 font-black">TAXABLE VAL</th>
                                                <th className="py-1 font-black">CGST AMT</th>
                                                <th className="py-1 font-black">SGST AMT</th>
                                                <th className="py-1 font-black">TOTAL GST</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {Object.entries(taxSummary).map(([rate, vals]) => (
                                                <tr key={rate} className="font-bold text-slate-700">
                                                    <td className="py-1">{rate}%</td>
                                                    <td className="py-1">{vals.taxable.toFixed(2)}</td>
                                                    <td className="py-1">{vals.cgst.toFixed(2)}</td>
                                                    <td className="py-1">{vals.sgst.toFixed(2)}</td>
                                                    <td className="py-1">{(vals.cgst + vals.sgst).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="font-black pt-4 border-t-[2px] border-black mt-2 text-slate-800">
                                        <span className="text-slate-400 mr-2">AMOUNT IN WORDS:</span>
                                        <span className="capitalize text-xs tracking-tight">{numberToWords(netTotal)} Rupees Only</span>
                                    </div>
                                </div>

                                {/* Summary Block */}
                                <div className="w-64 p-4 flex flex-col justify-end bg-emerald-50/20">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-slate-500 font-bold">
                                            <span>TOTAL GST</span>
                                            <span className="text-slate-800">₹{totalGSTValue.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 font-bold">
                                            <span>ROUND OFF</span>
                                            <span className="text-slate-800">{roundOff}</span>
                                        </div>
                                        <div className="pt-3 border-t-[2px] border-black flex flex-col items-end">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Payable Net Total</span>
                                            <span className="font-black text-3xl text-slate-900 tracking-tighter">₹{netTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div className="border-t-[2px] border-black flex justify-between items-end px-6 py-8 h-32 relative group">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                        <IndianRupee size={12} className="text-emerald-500" /> Digital Settlements
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-dotted border-slate-300">
                                        <p className="font-black text-slate-800 text-[10px]">GPay: 9698511002</p>
                                        <p className="font-bold text-slate-500 text-[8px] mt-1 uppercase">Prop: Suresh</p>
                                    </div>
                                </div>

                                <div className="text-center w-32 border-t-[1px] border-black/20 pt-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Receiver Sign</span>
                                </div>

                                <div className="text-center w-40 flex flex-col items-center">
                                    {/* Placeholder for stamp/seal space */}
                                    <div className="w-16 h-16 bg-slate-50/50 rounded-full border border-dashed border-slate-200 mb-2 flex items-center justify-center -mt-8">
                                        <ShieldCheck size={24} className="text-slate-100" />
                                    </div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] border-t-[1px] border-black/20 pt-2 w-full">Authorised Seal</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer Footnote */}
                    <p className="mt-8 text-[9px] text-slate-400 font-bold italic text-center print:hidden">
                        Computer generated invoice - Physical signature optional for digital logs.
                        Subject to Tirunelveli Jurisdiction.
                    </p>
                </div>

                {/* Digital Audit Trail (Screen Only) */}
                <div className="mt-8 mb-16 print:hidden">
                    <div className="flex items-center gap-3 mb-6 px-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <History size={18} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Settlement Logs</h3>
                    </div>

                    {invoice.Payments && invoice.Payments.length > 0 ? (
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden shadow-slate-200/50">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collector</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoice.Payments.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black text-xs">
                                                        {p.collectedBy?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="font-bold text-slate-700">{p.collectedBy?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                                {new Date(p.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-800 tracking-wide uppercase">{p.paymentMode}</span>
                                                    {p.transactionId && <span className="text-[9px] text-slate-400 font-bold font-mono">ID: {p.transactionId}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-emerald-600">₹{parseFloat(p.amount).toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50/30">
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Settlement</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 border-l border-slate-100">
                                            ₹{invoice.Payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-slate-100 border-dashed p-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-2">
                                <History size={24} className="opacity-20" />
                            </div>
                            <p className="font-bold text-sm tracking-tight text-slate-500">No payment records found for this invoice.</p>
                            <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Awaiting Settlement</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { 
                        background: white; 
                        -webkit-print-color-adjust: exact; 
                        margin: 0;
                    }
                    .print\\:hidden { display: none !important; }
                    .max-w-\\[210mm\\] { 
                        max-width: none !important; 
                        width: 100% !important; 
                        margin: 0 !important; 
                        box-shadow: none !important; 
                        padding: 0 !important;
                    }
                    .bg-white { background: white !important; }
                    .min-h-screen { min-height: 0 !important; }
                    .shadow-2xl { box-shadow: none !important; }
                    .rounded-\\[3rem\\], .rounded-b-\\[3rem\\] { border-radius: 0 !important; }
                    .border { border: none !important; }
                    .border-black { border-color: black !important; border-width: 2px !important; }
                    .bg-slate-50 { background-color: #f8fafc !important; }
                    .bg-slate-900 { background-color: #0f172a !important; }
                    .text-white { color: white !important; }
                }
            `}</style>
        </div>
    );
};

export default InvoiceView;
