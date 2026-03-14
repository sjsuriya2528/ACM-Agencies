import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import 'invoice_view_screen.dart';

class CollectPaymentScreen extends StatefulWidget {
  const CollectPaymentScreen({super.key});

  @override
  State<CollectPaymentScreen> createState() => _CollectPaymentScreenState();
}

class _CollectPaymentScreenState extends State<CollectPaymentScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _invoices = [];
  bool _isLoading = true;
  String _searchTerm = '';
  int? _expandedId;
  final Map<int, TextEditingController> _amountControllers = {};
  final Map<int, TextEditingController> _refControllers = {};
  final Map<int, String> _paymentModes = {};
  int? _processingId;

  @override
  void initState() {
    super.initState();
    _fetchInvoices();
  }

  Future<void> _fetchInvoices() async {
    try {
      final response = await _apiService.get('/invoices?status=Pending');
      if (response.statusCode == 200) {
        setState(() {
          // Filter invoices where Order status is Delivered (matching React logic)
          _invoices = response.data.where((inv) {
            final orderStatus = inv['Order']?['status'];
            return orderStatus == 'Delivered';
          }).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching invoices: $e');
      setState(() => _isLoading = false);
    }
  }

  void _toggleExpand(int id, double balance) {
    setState(() {
      if (_expandedId == id) {
        _expandedId = null;
      } else {
        _expandedId = id;
        if (!_amountControllers.containsKey(id)) {
          _amountControllers[id] = TextEditingController(text: balance.toStringAsFixed(0));
          _refControllers[id] = TextEditingController();
          _paymentModes[id] = 'Cash';
        }
      }
    });
  }

  Future<void> _submitPayment(int invoiceId, double dueAmount) async {
    final amount = double.tryParse(_amountControllers[invoiceId]?.text ?? '');
    if (amount == null || amount <= 0) {
      _showError('Please enter a valid amount');
      return;
    }
    if (amount > dueAmount) {
      _showError('Amount cannot exceed the due amount');
      return;
    }

    final mode = _paymentModes[invoiceId] ?? 'Cash';
    final ref = _refControllers[invoiceId]?.text ?? '';

    if (mode != 'Cash' && ref.isEmpty) {
      _showError('Please enter transaction reference');
      return;
    }

    setState(() => _processingId = invoiceId);

    try {
      await _apiService.post('/payments', data: {
        'invoiceId': invoiceId,
        'amount': amount,
        'paymentMode': mode,
        'transactionId': ref,
      });

      _showSuccess('Payment submitted for admin approval!');
      _fetchInvoices();
      setState(() => _expandedId = null);
    } catch (e) {
      _showError('Failed to record payment: $e');
    } finally {
      setState(() => _processingId = null);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  void _showSuccess(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: const Color(0xFF10B981)));
  }

  String _getRetailerName(dynamic inv) {
    return inv['customerName'] ?? inv['Order']?['retailer']?['shopName'] ?? 'Unknown Retailer';
  }

  List<dynamic> get _filteredInvoices {
    return _invoices.where((inv) {
      final name = _getRetailerName(inv).toLowerCase();
      final id = inv['id'].toString();
      return name.contains(_searchTerm.toLowerCase()) || id.contains(_searchTerm);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardTheme.color,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: Theme.of(context).textTheme.bodySmall?.color),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Collect Payments',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5),
        ),
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          Expanded(
            child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _filteredInvoices.isEmpty
                ? _buildEmptyState()
                : _buildInvoiceList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      color: Theme.of(context).cardTheme.color,
      padding: const EdgeInsets.all(16),
      child: TextField(
        onChanged: (value) => setState(() => _searchTerm = value),
        decoration: InputDecoration(
          hintText: 'Search by retailer or bill #',
          prefixIcon: const Icon(LucideIcons.search, size: 20),
          contentPadding: const EdgeInsets.symmetric(vertical: 0),
          fillColor: Theme.of(context).scaffoldBackgroundColor,
          filled: true,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
        ),
      ),
    );
  }

  Widget _buildInvoiceList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredInvoices.length,
      itemBuilder: (context, index) {
        final inv = _filteredInvoices[index];
        final id = inv['id'];
        final isExpanded = _expandedId == id;
        final rawBalance = inv['balanceAmount'] ?? inv['netTotal'];
        final balance = rawBalance is String ? double.tryParse(rawBalance) ?? 0.0 : (rawBalance ?? 0).toDouble();
        final name = _getRetailerName(inv);

        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardTheme.color,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: isExpanded ? Theme.of(context).colorScheme.secondary : Theme.of(context).dividerColor.withOpacity(0.1), width: isExpanded ? 2 : 1),
            boxShadow: [
              if (isExpanded)
                BoxShadow(color: Theme.of(context).colorScheme.secondary.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10))
              else
                BoxShadow(color: Theme.of(context).brightness == Brightness.dark ? Colors.black.withOpacity(0.2) : Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              InkWell(
                onTap: () => _toggleExpand(id, balance),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 6,
                        height: 60,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)], begin: Alignment.topCenter, end: Alignment.bottomCenter),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        flex: 7,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Wrap(
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Text('BILL #$id', style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                                const SizedBox(width: 8),
                                Icon(LucideIcons.calendar, size: 10, color: Theme.of(context).textTheme.bodySmall?.color),
                                const SizedBox(width: 4),
                                Text(DateFormat('dd/MM/yy').format(DateTime.parse(inv['createdAt'])), style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 10, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(name, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Theme.of(context).textTheme.titleLarge?.color)),
                            const SizedBox(height: 8),
                            InkWell(
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (context) => InvoiceViewScreen(invoiceId: id)),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                                child: Wrap(
                                  crossAxisAlignment: WrapCrossAlignment.center,
                                  children: [
                                    Icon(LucideIcons.fileText, size: 10, color: Theme.of(context).colorScheme.primary),
                                    const SizedBox(width: 4),
                                    Text('EXPLORE FULL INVOICE', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 8, fontWeight: FontWeight.w900)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('DUE', style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 9, fontWeight: FontWeight.w800)),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerRight,
                              child: Text('₹${balance.toStringAsFixed(0)}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF10B981))),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (isExpanded) _buildExpandedForm(id, balance),
            ],
          ),
        );
      },
    );
  }

  Widget _buildExpandedForm(int id, double balance) {
    return Container(
      padding: const EdgeInsets.all(24),
      color: Theme.of(context).scaffoldBackgroundColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('PAYMENT MODE', style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 12),
          Row(
            children: ['Cash', 'UPI', 'Cheque'].map((mode) {
              final isSelected = _paymentModes[id] == mode;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: InkWell(
                    onTap: () => setState(() => _paymentModes[id] = mode),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: isSelected ? Theme.of(context).colorScheme.primary : Theme.of(context).cardTheme.color,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isSelected ? Theme.of(context).colorScheme.primary : Theme.of(context).dividerColor.withOpacity(0.1)),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            mode == 'Cash' ? LucideIcons.banknote : mode == 'UPI' ? LucideIcons.wallet : LucideIcons.creditCard,
                            color: isSelected ? Colors.white : Theme.of(context).textTheme.bodyMedium?.color,
                            size: 20,
                          ),
                          const SizedBox(height: 8),
                          Text(mode, style: TextStyle(color: isSelected ? Colors.white : const Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w900)),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          Text('COLLECTION AMOUNT', style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 12),
          TextField(
            controller: _amountControllers[id],
            keyboardType: TextInputType.number,
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Theme.of(context).textTheme.bodyLarge?.color),
            decoration: InputDecoration(
              prefixIcon: Icon(LucideIcons.indianRupee, size: 20, color: Theme.of(context).textTheme.bodySmall?.color),
              fillColor: Theme.of(context).cardTheme.color,
              filled: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            ),
          ),
          if (_paymentModes[id] != 'Cash') ...[
            const SizedBox(height: 24),
            Text('REFERENCE / TRANS ID', style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
            const SizedBox(height: 12),
            TextField(
              controller: _refControllers[id],
              style: TextStyle(fontWeight: FontWeight.w600, color: Theme.of(context).textTheme.bodyLarge?.color),
              decoration: InputDecoration(
                hintText: 'Enter ${_paymentModes[id]} Ref #',
                hintStyle: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.5)),
                fillColor: Theme.of(context).cardTheme.color,
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),
          ],
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _processingId == id ? null : () => _submitPayment(id, balance),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 10,
                shadowColor: const Color(0xFF10B981).withOpacity(0.3),
              ),
              child: _processingId == id
                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                : const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.shieldCheck, size: 22),
                        SizedBox(width: 12),
                        Text('CONFIRM RECEIPT', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                      ],
                    ),
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(30),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(40)),
            child: const Icon(LucideIcons.checkCircle, size: 60, color: Color(0xFF10B981)),
          ),
          const SizedBox(height: 24),
          const Text('Zero Pendency!', style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w900, fontSize: 24)),
          const Text('All scheduled payments have been accounted for.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
        ],
      ),
    );
  }
}
