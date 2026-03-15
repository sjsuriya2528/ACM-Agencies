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
          final data = response.data;
          // Handle both direct object and { data: {...} } wrapper
          _invoice = data is Map && data.containsKey('data') ? data['data'] : data;
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

    final order = _invoice['order'] ?? _invoice['Order'];
    final items = order?['items'] as List<dynamic>? ?? [];
    final netTotal = (double.tryParse(_invoice['netTotal']?.toString() ?? '0') ?? 0).round();

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Payment History'),
        backgroundColor: Theme.of(context).cardTheme.color,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: Theme.of(context).textTheme.bodySmall?.color),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.printer, color: Theme.of(context).textTheme.bodySmall?.color),
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
            if (_invoice['payments'] != null && (_invoice['payments'] as List).isNotEmpty)
              ...[
                _buildSectionTitle('Settlement Logs'),
                const SizedBox(height: 8),
                _buildSettlementLogs(),
              ],
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildBillPaper(List<dynamic> items, int netTotal) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(Theme.of(context).brightness == Brightness.dark ? 0.2 : 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
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
    final textColor = Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black;
    final borderColor = Theme.of(context).dividerColor;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: borderColor, width: 1.5))),
      width: double.infinity,
      child: Column(
        children: [
          Text('A.C.M AGENCIES', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textColor)),
          const SizedBox(height: 4),
          Text(
            '9/141/D, SANKARANKOVIL MAIN ROAD\nRAMAYANPATTI, TIRUNELVELI - 627538\nGSTIN : 33KFPP50618L1ZU\nMOBILE : 9698511002, 9443333438',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: textColor, height: 1.3),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoGrid() {
    final borderColor = Theme.of(context).dividerColor;
    return Container(
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: borderColor, width: 1.5))),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 6,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(border: Border(right: BorderSide(color: borderColor, width: 1.5))),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _infoRow('Buyer', _invoice['customerName'] ?? _invoice['order']?['retailer']?['shopName'] ?? ''),
                  _infoRow('Address', _invoice['customerAddress'] ?? _invoice['order']?['retailer']?['address'] ?? ''),
                  const SizedBox(height: 12),
                  _infoRow('Mobile', _invoice['customerPhone'] ?? _invoice['order']?['retailer']?['phone'] ?? ''),
                  _infoRow('GSTIN', _invoice['order']?['retailer']?['gstin'] ?? ''),
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
                  decoration: BoxDecoration(border: Border(top: BorderSide(color: borderColor, width: 1.5))),
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
    final borderColor = Theme.of(context).dividerColor;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 8),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: borderColor, width: 1.5))),
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
    final borderColor = Theme.of(context).dividerColor;
    return Table(
      border: TableBorder(
        horizontalInside: BorderSide(color: borderColor.withOpacity(0.5), width: 0.5),
        verticalInside: BorderSide(color: borderColor, width: 1.5),
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
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: borderColor, width: 1.5))),
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
              _td((idx + 1).toString(), align: TextAlign.center),
              _td(product?['name']?.toString().toUpperCase() ?? ''),
              _td(product?['hsnCode']?.toString() ?? '', align: TextAlign.center),
              _td(item['quantity'].toString(), align: TextAlign.center),
              _td(rate.toStringAsFixed(2), align: TextAlign.right),
              _td(product?['gstPercentage']?.toString() ?? '18', align: TextAlign.center),
              _td(grossAmt.toStringAsFixed(2), align: TextAlign.right, bold: true),
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

  Widget _th(String label) {
    final textColor = Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
      child: Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColor)),
    );
  }
  Widget _td(String label, {TextAlign align = TextAlign.center, bool bold = false}) {
    final textColor = Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 3, horizontal: 2),
      child: Text(label, textAlign: align, style: TextStyle(fontSize: 8, fontWeight: bold ? FontWeight.w900 : FontWeight.bold, color: textColor)),
    );
  }
  Widget _buildBillFooter(int netTotal) {
    final borderColor = Theme.of(context).dividerColor;
    final textColor = Theme.of(context).textTheme.bodyLarge?.color ?? Colors.black;
    return Container(
      decoration: BoxDecoration(border: Border(top: BorderSide(color: borderColor, width: 1.5))),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: borderColor, width: 1.5))),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Amount in words: ${_numberToWords(netTotal).toUpperCase()} ONLY',
                    style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, color: textColor),
                  ),
                ),
              ],
            ),
          ),
          Row(
            children: [
              Expanded(flex: 70, child: Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('Total', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColor)))),
              Container(width: 1.5, height: 20, color: borderColor),
              Expanded(flex: 30, child: Padding(padding: EdgeInsets.symmetric(horizontal: 8), child: Text('', textAlign: TextAlign.right))),
            ],
          ),
          Container(
            decoration: BoxDecoration(border: Border(top: BorderSide(color: borderColor, width: 1.5))),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  flex: 7,
                  child: Container(
                    decoration: BoxDecoration(border: Border(right: BorderSide(color: borderColor, width: 1.5))),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(4),
                          child: Text('TAX SUMMARY', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: textColor)),
                        ),
                        Divider(height: 1, color: borderColor),
                        Padding(
                          padding: const EdgeInsets.all(8),
                          child: Text('${_numberToWords(netTotal)} Rupees Only'.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: textColor)),
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
                        Divider(height: 16, color: borderColor, thickness: 1.5),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('NET TOTAL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: textColor)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                alignment: Alignment.centerRight,
                                child: Text('₹$netTotal', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textColor)),
                              ),
                            ),
                          ],
                        ),
                        if (_invoice['order'] != null) ...[
                          _buildDetailRow(
                            'Order ID',
                            '#${_invoice['order']['id']}',
                          ),
                          _buildDetailRow(
                            'Order Status',
                            _invoice['order']['status'] ?? 'N/A',
                          ),
                        ],
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

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: [
          Icon(LucideIcons.history, size: 18, color: Theme.of(context).colorScheme.onSurfaceVariant),
          const SizedBox(width: 8),
          Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Theme.of(context).colorScheme.onSurface)),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
          Text(value, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  Widget _buildSettlementLogs() {
    List<dynamic> logs = _invoice['payments'] ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            children: [
              Icon(LucideIcons.history, size: 18, color: Theme.of(context).colorScheme.onSurfaceVariant),
              const SizedBox(width: 8),
              Text('SETTLEMENT LOGS', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Theme.of(context).colorScheme.onSurface)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(color: Theme.of(context).cardTheme.color, borderRadius: BorderRadius.circular(20), border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: logs.length,
            separatorBuilder: (context, index) => Divider(height: 1, color: Theme.of(context).dividerColor.withOpacity(0.1)),
            itemBuilder: (context, index) {
              final p = logs[index];
              return Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                      child: Center(child: Text(p['collectedBy']?['name']?[0] ?? 'U', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w900))),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p['collectedBy']?['name'] ?? 'Unknown', style: TextStyle(fontWeight: FontWeight.w900, color: Theme.of(context).textTheme.bodyLarge?.color)),
                          Text(DateFormat('dd MMM, hh:mm a').format(DateTime.parse(p['createdAt'])), style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 11, fontWeight: FontWeight.bold)),
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
                          Text(p['paymentMode'], style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
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
