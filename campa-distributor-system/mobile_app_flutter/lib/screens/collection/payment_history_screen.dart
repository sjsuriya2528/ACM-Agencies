import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import 'invoice_view_screen.dart';

class PaymentHistoryScreen extends StatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  State<PaymentHistoryScreen> createState() => _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends State<PaymentHistoryScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _payments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchPayments();
  }

  Future<void> _fetchPayments() async {
    try {
      final response = await _apiService.get('/payments');
      if (response.statusCode == 200) {
        setState(() {
          final responseData = response.data;
          _payments = responseData is Map ? (responseData['data'] ?? []) : responseData;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching payments: $e');
      setState(() => _isLoading = false);
    }
  }

  IconData _getPaymentIcon(String mode) {
    switch (mode) {
      case 'Cash': return LucideIcons.banknote;
      case 'UPI': return LucideIcons.wallet;
      default: return LucideIcons.creditCard;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Payment History'),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _payments.isEmpty
          ? _buildEmptyState()
          : _buildPaymentList(),
    );
  }

  Widget _buildPaymentList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _payments.length,
      itemBuilder: (context, index) {
        final payment = _payments[index];
        final mode = payment['paymentMode'];
        final IconData modeIcon = _getPaymentIcon(mode);
        final shopName = payment['Invoice']?['Order']?['retailer']?['shopName'] ?? 'Market Collection';
        final rawAmount = payment['amount'] ?? 0;
        final amount = rawAmount is String ? double.tryParse(rawAmount) ?? 0.0 : (rawAmount).toDouble();

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: const Color(0xFFF1F5F9)),
            boxShadow: [
              BoxShadow(color: const Color(0xFF1E293B).withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 7,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text('ID: #${payment['id']}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                              const SizedBox(width: 8),
                              const Icon(LucideIcons.calendar, size: 10, color: Color(0xFF94A3B8)),
                              const SizedBox(width: 4),
                              Text(DateFormat('dd/MM/yy').format(DateTime.parse(payment['createdAt'])), style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(shopName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
                                child: Icon(modeIcon, size: 14, color: const Color(0xFF94A3B8)),
                              ),
                              const SizedBox(width: 8),
                              Text('Paid via $mode', style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      flex: 3,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerRight,
                            child: Text('₹${amount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF10B981))),
                          ),
                          const SizedBox(height: 4),
                          const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.shieldCheck, size: 12, color: Color(0xFF10B981)),
                              SizedBox(width: 4),
                              Text('VERIFIED', style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Divider(height: 32, color: Color(0xFFF1F5F9), thickness: 1),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('BILL REFERENCE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 9, fontWeight: FontWeight.w800)),
                              Text('Inv #${payment['invoiceId']}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF64748B))),
                            ],
                          ),
                          if (payment['transactionId'] != null && payment['transactionId'].toString().isNotEmpty) ...[
                            const SizedBox(width: 16),
                            Container(width: 1, height: 24, color: const Color(0xFFF1F5F9)),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('REF NUMBER', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 9, fontWeight: FontWeight.w800)),
                                  FittedBox(
                                    fit: BoxFit.scaleDown,
                                    alignment: Alignment.centerLeft,
                                    child: Text(payment['transactionId'].toString().toUpperCase(), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF64748B), letterSpacing: 0.5)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.chevronRight, color: Color(0xFFCBD5E1), size: 16),
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (context) => InvoiceViewScreen(invoiceId: payment['invoiceId'])),
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
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
            child: const Icon(LucideIcons.history, size: 60, color: Color(0xFFF1F5F9)),
          ),
          const SizedBox(height: 24),
          const Text('No Transactions Yet', style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w900, fontSize: 20)),
          const Text('Your transaction history will appear here.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
        ],
      ),
    );
  }
}
