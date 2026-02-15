import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Printer } from 'lucide-react';

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

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
    );

    if (!invoice) return (
        <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
            Invoice not found
        </div>
    );

    const items = invoice.Order?.items || [];
    const totalAmount = parseFloat(invoice.totalAmount || 0);
    const roundOff = (Math.round(totalAmount) - totalAmount).toFixed(2);
    const netTotal = Math.round(totalAmount);

    // Calculate Taxes
    const taxSummary = {};
    let totalTaxableValue = 0;
    let totalGSTValue = 0;

    const enrichedItems = items.map(item => {
        const qty = item.quantity;
        const total = parseFloat(item.totalPrice);
        const gstRate = parseFloat(item.Product?.gstPercentage || 18); // Default 18% if missing

        // Back-calculate Taxable Value from Total (assuming Total is Inclusive)
        // Formula: Taxable = Total / (1 + GST%)
        const taxableValue = total / (1 + (gstRate / 100));
        const gstAmount = total - taxableValue;
        const taxableRate = taxableValue / qty;

        // Aggregate Tax Summary
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
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            {/* Header/Actions - Hidden on Print */}
            <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-black font-medium transition-colors"
                >
                    <ArrowLeft size={20} /> Back
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all"
                >
                    <Printer size={18} /> Print Invoice
                </button>
            </div>

            {/* A4 Paper Representation */}
            <div className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full p-8 print:p-0 min-h-[297mm] print:min-h-0 text-black font-inter text-sm relative">

                {/* Border Container */}
                <div className="border-[2px] border-black min-h-[225mm] flex flex-col justify-between">

                    <div>
                        {/* Header */}
                        <div className="text-center border-b-[2px] border-black p-4">
                            <h1 className="text-2xl font-bold uppercase mb-1">A.C.M AGENCIES</h1>
                            <p className="font-semibold text-xs text-gray-800">9/141/D, SANKARANKOVIL MAIN ROAD</p>
                            <p className="font-semibold text-xs text-gray-800">RAMAYANPATTI, TIRUNELVELI - 627538</p>
                            <div className="mt-2 text-xs font-bold">
                                GSTIN : 33KFPP50618L1ZU <br />
                                MOBILE : 9698511002, 9443333438
                            </div>
                        </div>

                        {/* Customer & Invoice Details Grid */}
                        <div className="flex border-b-[2px] border-black">
                            {/* Left Column: Customer */}
                            <div className="w-1/2 p-2 border-r-[2px] border-black text-xs">
                                <div className="grid grid-cols-[80px_1fr] mb-1">
                                    <span className="font-bold">Buyer Name</span>
                                    <span className="font-bold uppercase break-words">: {invoice.customerName || invoice.Order?.retailer?.shopName}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] mb-1">
                                    <span className="font-bold">Address</span>
                                    <span className="break-words">: {invoice.customerAddress || invoice.Order?.retailer?.address}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] mb-1 gap-y-1">
                                    <span className="font-bold">Mobile</span>
                                    <span>: {invoice.customerPhone || invoice.Order?.retailer?.phone}</span>

                                    <span className="font-bold">Cust GSTin</span>
                                    <span>: {invoice.Order?.retailer?.gstin || ''}</span>
                                </div>
                            </div>

                            {/* Right Column: Invoice Details */}
                            <div className="w-1/2 flex flex-col">
                                <div className="flex-1 p-2 text-xs">
                                    <div className="grid grid-cols-[80px_1fr] mb-1">
                                        <span className="font-bold">Invoice No</span>
                                        <span className="font-bold">: {invoice.invoiceNumber || invoice.id}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] mb-1">
                                        <span className="font-bold">Date</span>
                                        <span className="font-bold">: {new Date(invoice.createdAt).toLocaleDateString('en-GB')}</span>
                                    </div>
                                    {/* Optional Vehicle Field */}
                                    <div className="grid grid-cols-[80px_1fr] mb-1">
                                        <span className="font-bold">Vehicle</span>
                                        <span>: </span>
                                    </div>
                                </div>
                                <div className="border-t-[2px] border-black text-center py-1 font-bold bg-gray-100 text-xs">
                                    GST INVOICE
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b-[2px] border-black text-center">
                                    <th className="border-r-[2px] border-black w-10 py-1">SNO</th>
                                    <th className="border-r-[2px] border-black py-1 text-left px-2">DESCRIPTION</th>
                                    <th className="border-r-[2px] border-black w-16 py-1">HSN</th>
                                    <th className="border-r-[2px] border-black w-12 py-1">Qty</th>
                                    <th className="border-r-[2px] border-black w-16 py-1">RATE</th>
                                    <th className="border-r-[2px] border-black w-12 py-1">GST%</th>
                                    <th className="w-20 py-1">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black">
                                {enrichedItems.map((item, index) => (
                                    <tr key={index} className="border-b border-black">
                                        <td className="border-r-[2px] border-black text-center py-1">{index + 1}</td>
                                        <td className="border-r-[2px] border-black px-2 py-1">{item.Product?.name || 'Unknown'}</td>
                                        <td className="border-r-[2px] border-black text-center py-1">{item.hsn}</td>
                                        <td className="border-r-[2px] border-black text-center py-1">{item.quantity}</td>
                                        <td className="border-r-[2px] border-black text-right px-2 py-1">{item.taxableRate.toFixed(2)}</td>
                                        <td className="border-r-[2px] border-black text-center py-1">{item.gstRate}</td>
                                        <td className="text-right px-2 py-1 font-bold text-sm">{parseFloat(item.totalPrice).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {/* Fill empty rows to maintain height if needed, or just let it flow */}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Section - Fixed at Bottom of Container */}
                    <div>
                        {/* Total Row */}
                        <div className="border-t-[2px] border-black flex text-xs font-bold">
                            <div className="flex-1 border-r-[2px] border-black text-right px-2 py-1">Total</div>
                            <div className="w-12 border-r-[2px] border-black text-center py-1">
                                {items.reduce((acc, i) => acc + parseInt(i.quantity), 0)}
                            </div>
                            <div className="w-20 text-right px-2 py-1">
                                {totalAmount.toFixed(2)}
                            </div>
                        </div>

                        {/* Tax & Summary Grid */}
                        <div className="border-t-[2px] border-black flex text-xs h-32">
                            {/* Left: Tax Breakdown */}
                            <div className="flex-1 border-r-[2px] border-black flex flex-col justify-between p-1">
                                <table className="w-full text-center mb-2">
                                    <thead>
                                        <tr className="border-b border-gray-400">
                                            <th className="w-12">GST%</th>
                                            <th>TAXABLE</th>
                                            <th>CGSTVAL</th>
                                            <th>SGSTVAL</th>
                                            <th>IGSTVAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(taxSummary).map(([rate, vals]) => (
                                            <tr key={rate}>
                                                <td>{rate}</td>
                                                <td>{vals.taxable.toFixed(2)}</td>
                                                <td>{vals.cgst.toFixed(2)}</td>
                                                <td>{vals.sgst.toFixed(2)}</td>
                                                <td>{vals.igst.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="font-bold capitalize border-t-[2px] border-black pt-1">
                                    {numberToWords(netTotal)} Rupees Only
                                </div>
                            </div>

                            {/* Right: Final Summary */}
                            <div className="w-48 p-2 flex flex-col justify-end">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold">GST VALUE</span>
                                    <span>{totalGSTValue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold">DISCOUNT</span>
                                    <span>0.00</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold">ROUND OFF</span>
                                    <span>{roundOff}</span>
                                </div>
                                <div className="flex justify-between border-t-[2px] border-black pt-1 mt-1 text-sm">
                                    <span className="font-bold text-base">NET TOTAL</span>
                                    <span className="font-bold text-lg">{netTotal}</span>
                                </div>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="border-t-[2px] border-black flex justify-between items-end p-4 pt-12 text-xs font-bold h-24">
                            <div className="text-center">
                                Gpay No<br />SURESH<br />9698511002
                            </div>
                            <div className="text-center border-t border-black px-4 pt-1">
                                Customer Signature
                            </div>
                            <div className="text-center border-t border-black px-4 pt-1">
                                Authorised Signature
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { 
                        background: white; 
                        -webkit-print-color-adjust: exact; 
                    }
                    .print\\:hidden { display: none !important; }
                    .max-w-\\[210mm\\] { max-width: none !important; width: 100% !important; margin: 0 !important; box-shadow: none !important; }
                    .min-h-screen { min-height: 0 !important; }
                }
            `}</style>
        </div>
    );
};

export default InvoiceView;
