import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class InvoiceViewScreen extends StatefulWidget {
  final int invoiceId;
  const InvoiceViewScreen({super.key, required this.invoiceId});

  @override
  State<InvoiceViewScreen> createState() => _InvoiceViewScreenState();
}

class _InvoiceViewScreenState extends State<InvoiceViewScreen> {
  final ApiService _apiService = ApiService();
  dynamic _invoice;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchInvoice();
  }

  Future<void> _fetchInvoice() async {
    try {
      final response = await _apiService.get('/invoices/${widget.invoiceId}');
      if (response.statusCode == 200) {
        setState(() {
          _invoice = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching invoice: $e');
      setState(() => _isLoading = false);
    }
  }

  String _numberToWords(int num) {
    if (num == 0) return 'Zero';
    var words = '';
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num >= 10000000) {
      words += '${_numberToWords(num ~/ 10000000)} Crore ';
      num %= 10000000;
    }
    if (num >= 100000) {
      words += '${_numberToWords(num ~/ 100000)} Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      words += '${_numberToWords(num ~/ 1000)} Thousand ';
      num %= 1000;
    }
    if (num >= 100) {
      words += '${units[num ~/ 100]} Hundred ';
      num %= 100;
    }
    if (num > 0) {
      if (words != '') words += 'and ';
      if (num < 20) {
        words += units[num];
      } else {
        words += tens[num ~/ 10];
        if (num % 10 > 0) words += ' ${units[num % 10]}';
      }
    }
    return words.trim();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_invoice == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Invoice not found')));

    final order = _invoice['Order'];
    final items = order?['items'] as List<dynamic>? ?? [];
    final netTotal = (double.tryParse(_invoice['netTotal']?.toString() ?? '0') ?? 0).round();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text('Bill #${_invoice['invoiceNumber'] ?? _invoice['id']}'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.printer, color: Color(0xFF1E293B)),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            _buildBillPaper(items, netTotal),
            const SizedBox(height: 24),
            if (_invoice['Payments'] != null && (_invoice['Payments'] as List).isNotEmpty)
              _buildSettlementLogs(),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildBillPaper(List<dynamic> items, int netTotal) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 5))],
        border: Border.all(color: Colors.black, width: 1.5),
      ),
      child: Column(
        children: [
          _buildBillHeader(),
          _buildInfoGrid(),
          _buildItemsTable(items),
          _buildBillFooter(netTotal),
        ],
      ),
    );
  }

  Widget _buildBillHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.black, width: 1.5))),
      width: double.infinity,
      child: const Column(
        children: [
          Text('A.C.M AGENCIES', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.black)),
          SizedBox(height: 4),
          Text(
            '9/141/D, SANKARANKOVIL MAIN ROAD\nRAMAYANPATTI, TIRUNELVELI - 627538\nGSTIN : 33KFPP50618L1ZU\nMOBILE : 9698511002, 9443333438',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.black, height: 1.3),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoGrid() {
    return Container(
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.black, width: 1.5))),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 6,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(border: Border(right: BorderSide(color: Colors.black, width: 1.5))),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _infoRow('Buyer', _invoice['customerName'] ?? _invoice['Order']?['retailer']?['shopName'] ?? ''),
                  _infoRow('Address', _invoice['customerAddress'] ?? _invoice['Order']?['retailer']?['address'] ?? ''),
                  const SizedBox(height: 12),
                  _infoRow('Mobile', _invoice['customerPhone'] ?? _invoice['Order']?['retailer']?['phone'] ?? ''),
                  _infoRow('GSTIN', _invoice['Order']?['retailer']?['gstin'] ?? ''),
                ],
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: Column(
              children: [
                _infoGridRow('Invoice No', _invoice['invoiceNumber'] ?? _invoice['id'].toString()),
                _infoGridRow('Date', DateFormat('dd/MM/yyyy').format(DateTime.parse(_invoice['createdAt']))),
                _infoGridRow('Vehicle', ''),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  decoration: const BoxDecoration(border: Border(top: BorderSide(color: Colors.black, width: 1.5))),
                  child: const Text('GST INVOICE', textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 50, child: Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold))),
          const Text(': ', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
          Expanded(child: Text(value.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900))),
        ],
      ),
    );
  }

  Widget _infoGridRow(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 8),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.black, width: 1.5))),
      child: Row(
        children: [
          SizedBox(width: 50, child: Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold))),
          const Text(': ', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900))),
        ],
      ),
    );
  }

  Widget _buildItemsTable(List<dynamic> items) {
    return Table(
      border: const TableBorder(
        horizontalInside: BorderSide(color: Colors.black26, width: 0.5),
        verticalInside: BorderSide(color: Colors.black, width: 1.5),
      ),
      columnWidths: const {
        0: FixedColumnWidth(30),
        1: FlexColumnWidth(),
        2: FixedColumnWidth(50),
        3: FixedColumnWidth(30),
        4: FixedColumnWidth(50),
        5: FixedColumnWidth(40),
        6: FixedColumnWidth(60),
      },
      children: [
        TableRow(
          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.black, width: 1.5))),
          children: [
            _th('SNO'), _th('DESCRIPTION'), _th('HSN'), _th('Qty'), _th('RATE'), _th('GST%'), _th('Amount'),
          ],
        ),
        ...items.asMap().entries.map((entry) {
          final idx = entry.key;
          final item = entry.value;
          final product = item['Product'];
          final grossAmt = (double.tryParse(item['netAmount']?.toString() ?? item['totalPrice']?.toString() ?? '0') ?? 0);
          final rate = item['quantity'] > 0 ? grossAmt / item['quantity'] : 0.0;

          return TableRow(
            children: [
              _td((idx + 1).toString(), center: true),
              _td(product?['name']?.toString().toUpperCase() ?? ''),
              _td(product?['hsnCode']?.toString() ?? '', center: true),
              _td(item['quantity'].toString(), center: true),
              _td(rate.toStringAsFixed(2), right: true),
              _td(product?['gstPercentage']?.toString() ?? '18', center: true),
              _td(grossAmt.toStringAsFixed(2), right: true, bold: true),
            ],
          );
        }),
        // Fill empty rows to maintain height
        if (10 - items.length > 0)
          ...List.generate(10 - items.length, (index) => TableRow(
            children: [_td(''), _td(''), _td(''), _td(''), _td(''), _td(''), _td('')],
          )),
      ],
    );
  }

  static Widget _th(String text) => Padding(padding: const EdgeInsets.all(4), child: Text(text, textAlign: TextAlign.center, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900)));
  static Widget _td(String text, {bool center = false, bool right = false, bool bold = false}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
    child: Text(text, textAlign: center ? TextAlign.center : (right ? TextAlign.right : TextAlign.left), style: TextStyle(fontSize: 9, fontWeight: bold ? FontWeight.w900 : FontWeight.bold)),
  );

  Widget _buildBillFooter(int netTotal) {
    return Container(
      decoration: const BoxDecoration(border: Border(top: BorderSide(color: Colors.black, width: 1.5))),
      child: Column(
        children: [
          Row(
            children: [
              const Expanded(flex: 70, child: Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('Total', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900)))),
              Container(width: 1.5, height: 20, color: Colors.black),
              const Expanded(flex: 30, child: Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('', textAlign: TextAlign.right))),
            ],
          ),
          Container(
            decoration: const BoxDecoration(border: Border(top: BorderSide(color: Colors.black, width: 1.5))),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  flex: 7,
                  child: Container(
                    decoration: const BoxDecoration(border: Border(right: BorderSide(color: Colors.black, width: 1.5))),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.all(4),
                          child: Text('TAX SUMMARY', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900)),
                        ),
                        const Divider(height: 1, color: Colors.black),
                        Padding(
                          padding: const EdgeInsets.all(8),
                          child: Text('${_numberToWords(netTotal)} Rupees Only'.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900)),
                        ),
                        const SizedBox(height: 40),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _sign('Customer Signature'),
                            _sign('Authorised Signature'),
                          ],
                        ),
                        const SizedBox(height: 8),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  flex: 3,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _footerMetric('GST VALUE', ((double.tryParse(_invoice['totalAmount']?.toString() ?? '0') ?? 0) - (double.tryParse(_invoice['totalPrice']?.toString() ?? '0') ?? 0)).toStringAsFixed(2)),
                        _footerMetric('ROUND OFF', (netTotal - (double.tryParse(_invoice['totalAmount']?.toString() ?? '0') ?? 0)).toStringAsFixed(2)),
                        const Divider(height: 16, color: Colors.black, thickness: 1.5),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('NET TOTAL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                alignment: Alignment.centerRight,
                                child: Text('₹$netTotal', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static Widget _sign(String text) => Container(
    width: 100,
    decoration: const BoxDecoration(border: Border(top: BorderSide(color: Colors.black))),
    padding: const EdgeInsets.only(top: 4),
    child: Text(text, textAlign: TextAlign.center, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold)),
  );

  Widget _footerMetric(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
        const SizedBox(width: 4),
        Expanded(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerRight,
            child: Text(value, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900)),
          ),
        ),
      ],
    );
  }

  Widget _buildSettlementLogs() {
    final payments = _invoice['Payments'] as List;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            children: [
              Icon(LucideIcons.history, size: 18, color: Color(0xFF64748B)),
              SizedBox(width: 8),
              Text('SETTLEMENT LOGS', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE2E8F0)), boxShadow: [BoxShadow(color: const Color(0xFF1E293B).withOpacity(0.05), blurRadius: 10)]),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: payments.length,
            separatorBuilder: (context, index) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
            itemBuilder: (context, index) {
              final p = payments[index];
              return Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(12)),
                      child: Center(child: Text(p['collectedBy']?['name']?[0] ?? 'U', style: const TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w900))),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p['collectedBy']?['name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                          Text(DateFormat('dd MMM, hh:mm a').format(DateTime.parse(p['createdAt'])), style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    Expanded(
                      flex: 4,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text('₹${p['amount']}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF10B981), fontSize: 16)),
                          ),
                          Text(p['paymentMode'], style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
