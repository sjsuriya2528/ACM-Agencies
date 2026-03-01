import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Printer, FileText, Download, Share2, ShieldCheck, Mail, Phone, MapPin, IndianRupee, History } from 'lucide-react';
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
        const qty = Number(item.quantity);
        const gstRate = Number(item.Product?.gstPercentage || 18);

        // If item has netAmount, it's the new format (netAmount = Gross, totalPrice = Taxable)
        // If not, totalPrice was the Gross total (legacy)
        const hasTaxFields = item.netAmount !== undefined && item.netAmount !== null;

        const totalGross = hasTaxFields ? Number(item.netAmount) : Number(item.totalPrice);

        // Calculate taxableValue and gstAmount robustly
        // If taxAmount is provided and > 0, we trust it. Otherwise, calculate backwards from totalGross.
        const taxableValue = (hasTaxFields && Number(item.taxAmount) > 0)
            ? Number(item.totalPrice)
            : (totalGross / (1 + (gstRate / 100)));

        const gstAmount = totalGross - taxableValue;
        const grossRate = totalGross / qty;

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
            grossRate,
            taxableValue,
            totalGross
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
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-[1.2rem] font-black text-sm shadow-xl transition-all active:scale-95"
                    >
                        <Printer size={18} /> Print
                    </button>
                </div>
            </div>

            {/* Paper Container */}
            <div className="max-w-[210mm] w-full mx-auto my-8 md:my-12 print:my-0 px-4 md:px-0">

                {/* Bill Design */}
                <div className="bg-white shadow-2xl print:shadow-none p-0 md:p-8 print:p-0">
                    <div className="bill-container border-[1.5px] border-black flex flex-col min-h-[270mm] bg-white text-black font-sans">

                        {/* Header */}
                        <div className="text-center border-b-[1.5px] border-black p-4">
                            <h2 className="text-2xl font-extrabold uppercase mb-1">A.C.M AGENCIES</h2>
                            <div className="text-[10px] font-bold leading-relaxed">
                                9/141/D, SANKARANKOVIL MAIN ROAD<br />
                                RAMAYANPATTI, TIRUNELVELI - 627538<br />
                                <span className="uppercase">GSTIN : 33KFPP50618L1ZU</span><br />
                                MOBILE : 9698511002, 9443333438
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="flex border-b-[1.5px] border-black text-[11px]">
                            <div className="w-[62%] border-r-[1.5px] border-black p-2">
                                <div className="flex mb-1"><span className="w-20 font-bold">Buyer Name</span><span className="flex-1 font-bold uppercase">: {invoice.customerName || invoice.Order?.retailer?.shopName}</span></div>
                                <div className="flex mb-1"><span className="w-20 font-bold">Address</span><span className="flex-1 font-bold uppercase">: {invoice.customerAddress || invoice.Order?.retailer?.address}</span></div>
                                <div className="flex mt-4"><span className="w-20 font-bold">Mobile</span><span className="flex-1 font-bold uppercase">: {invoice.customerPhone || invoice.Order?.retailer?.phone || '0'}</span></div>
                                <div className="flex"><span className="w-20 font-bold">Cust GSTin</span><span className="flex-1 font-bold uppercase">: {invoice.Order?.retailer?.gstin || ''}</span></div>
                            </div>
                            <div className="w-[38%] flex flex-col">
                                <div className="flex border-b-[1.5px] border-black p-1 px-2"><span className="w-20 font-bold">Invoice No</span><span className="flex-1 font-bold">: {invoice.invoiceNumber || invoice.id}</span></div>
                                <div className="flex border-b-[1.5px] border-black p-1 px-2"><span className="w-20 font-bold">Date</span><span className="flex-1 font-bold">: {new Date(invoice.createdAt).toLocaleDateString('en-GB')}</span></div>
                                <div className="flex p-1 px-2 flex-1"><span className="w-20 font-bold">Vehicle</span><span className="flex-1 font-bold">: </span></div>
                                <div className="border-t-[1.5px] border-black text-center py-1 font-extrabold text-[11px]">GST INVOICE</div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="flex-grow">
                            <table className="w-full text-[11px] border-collapse">
                                <thead>
                                    <tr className="border-b-[1.5px] border-black font-bold text-[10px]">
                                        <th className="border-r-[1.5px] border-black w-10 py-1">SNO</th>
                                        <th className="border-r-[1.5px] border-black text-left px-2 py-1">DESCRIPTION</th>
                                        <th className="border-r-[1.5px] border-black w-16 py-1">HSN</th>
                                        <th className="border-r-[1.5px] border-black w-10 py-1">Qty</th>
                                        <th className="border-r-[1.5px] border-black w-20 py-1 text-right px-2">RATE</th>
                                        <th className="border-r-[1.5px] border-black w-12 py-1">GST %</th>
                                        <th className="w-24 py-1 text-right px-2">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrichedItems.map((item, idx) => (
                                        <tr key={idx} className="border-b border-black/10">
                                            <td className="border-r-[1.5px] border-black text-center py-1.5 font-bold">{idx + 1}</td>
                                            <td className="border-r-[1.5px] border-black px-2 py-1.5 font-bold uppercase">{item.Product?.name || 'Unknown Item'}</td>
                                            <td className="border-r-[1.5px] border-black text-center py-1.5 font-bold">{item.hsn}</td>
                                            <td className="border-r-[1.5px] border-black text-center py-1.5 font-bold">{item.quantity}</td>
                                            <td className="border-r-[1.5px] border-black text-right px-2 py-1.5 font-bold">{item.grossRate.toFixed(2)}</td>
                                            <td className="border-r-[1.5px] border-black text-center py-1.5 font-bold">{item.gstRate}</td>
                                            <td className="text-right px-2 py-1.5 font-extrabold">{item.totalGross.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {/* Spacer rows */}
                                    {Array(Math.max(0, 10 - enrichedItems.length)).fill(0).map((_, i) => (
                                        <tr key={`empty-${i}`}>
                                            <td className="border-r-[1.5px] border-black py-2.5"></td>
                                            <td className="border-r-[1.5px] border-black"></td>
                                            <td className="border-r-[1.5px] border-black"></td>
                                            <td className="border-r-[1.5px] border-black"></td>
                                            <td className="border-r-[1.5px] border-black"></td>
                                            <td className="border-r-[1.5px] border-black"></td>
                                            <td></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="border-t-[1.5px] border-black">
                            {/* Total Bar */}
                            <div className="flex border-b-[1.5px] border-black font-extrabold text-[11px]">
                                <div className="flex-1 text-left px-16 py-1 border-r-[1.5px] border-black">Total</div>
                                <div className="w-10 text-center py-1 border-r-[1.5px] border-black">{items.reduce((acc, i) => acc + parseInt(i.quantity), 0)}</div>
                                <div className="w-24 text-right px-2 py-1">{totalAmount.toFixed(2)}</div>
                            </div>

                            {/* Summary Grid */}
                            <div className="flex text-[10px] min-h-[100px]">
                                <div className="w-[70%] border-r-[1.5px] border-black flex flex-col justify-between">
                                    <table className="w-full text-center border-collapse">
                                        <thead>
                                            <tr className="border-b-[1.5px] border-black font-extrabold">
                                                <th className="w-12 py-1 border-r-[1.5px] border-black">GST%</th>
                                                <th className="py-1 border-r-[1.5px] border-black">TAXABLE</th>
                                                <th className="py-1 border-r-[1.5px] border-black">CGSTVAL</th>
                                                <th className="py-1 border-r-[1.5px] border-black">SGSTVAL</th>
                                                <th className="py-1">IGSTVAL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(taxSummary).map(([rate, vals]) => (
                                                <tr key={rate} className="font-bold border-b border-black/10">
                                                    <td className="py-1 border-r-[1.5px] border-black">{rate}</td>
                                                    <td className="py-1 border-r-[1.5px] border-black">{vals.taxable.toFixed(2)}</td>
                                                    <td className="py-1 border-r-[1.5px] border-black">{vals.cgst.toFixed(2)}</td>
                                                    <td className="py-1 border-r-[1.5px] border-black">{vals.sgst.toFixed(2)}</td>
                                                    <td className="py-1">{vals.igst.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="p-2 border-t-[1.5px] border-black font-bold uppercase">
                                        {numberToWords(netTotal)} Rupees Only
                                    </div>
                                </div>
                                <div className="w-[30%] p-2 flex flex-col justify-end font-bold space-y-0.5">
                                    <div className="flex justify-between">
                                        <span>GST VALUE</span>
                                        <span>{totalGSTValue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>DISCOUNT</span>
                                        <span>0</span>
                                    </div>
                                    <div className="flex justify-between pb-1">
                                        <span>ROUND OFF</span>
                                        <span>{roundOff}</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t-[1.5px] border-black text-lg font-extrabold leading-none">
                                        <span>NET TOTAL</span>
                                        <span className="text-xl">{netTotal}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div className="flex min-h-[80px] text-[10px] font-bold">
                                <div className="w-1/3 p-2">
                                    Gpay No<br />SURESH<br />9698511002
                                </div>
                                <div className="w-1/3 flex flex-col justify-end items-center pb-2">
                                    <div className="w-4/5 border-t border-black pt-1 text-center">Customer Signature</div>
                                </div>
                                <div className="w-1/3 flex flex-col justify-end items-center pb-2">
                                    <div className="w-4/5 border-t border-black pt-1 text-center">Authorised Signature</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="mt-4 text-[9px] text-slate-400 font-bold italic text-center print:hidden">
                        Computer generated invoice - Physical signature optional for digital logs.
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

            {/* Global Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 15mm; size: A4; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .print\\:hidden { display: none !important; }
                    .max-w-\\[210mm\\] { max-width: none !important; width: 100% !important; margin: 0 !important; }
                    .bill-container { border-width: 1.5px !important; }
                }
            `}</style>
        </div>
    );
};

export default InvoiceView;
