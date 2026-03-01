import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class DeliveryDetailsScreen extends StatefulWidget {
  final int orderId;
  const DeliveryDetailsScreen({super.key, required this.orderId});

  @override
  State<DeliveryDetailsScreen> createState() => _DeliveryDetailsScreenState();
}

class _DeliveryDetailsScreenState extends State<DeliveryDetailsScreen> {
  final ApiService _apiService = ApiService();
  dynamic _order;
  bool _isLoading = true;
  bool _isCollectingPayment = false;
  String _paymentMode = 'Cash';
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _refController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchOrderDetails();
  }

  Future<void> _fetchOrderDetails() async {
    try {
      final response = await _apiService.get('/orders/${widget.orderId}');
      if (response.statusCode == 200) {
        setState(() {
          _order = response.data;
          if (_order['Invoice'] != null) {
            _amountController.text = (_order['Invoice']?['balanceAmount'] ?? _order['totalAmount']).toStringAsFixed(0);
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching order details: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String status) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm'),
        content: Text('Are you sure you want to mark this order as $status?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Confirm')),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await _apiService.put('/orders/${widget.orderId}/status', data: {'status': status});
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order marked as $status!')));
      _fetchOrderDetails();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update status')));
    }
  }

  Future<void> _submitPayment() async {
    if (_order['Invoice'] == null) return;

    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) {
       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid amount')));
       return;
    }

    setState(() => _isCollectingPayment = true);
    try {
      await _apiService.post('/payments', data: {
        'invoiceId': _order['Invoice']['id'],
        'amount': amount,
        'paymentMode': _paymentMode,
        'transactionId': _paymentMode != 'Cash' ? _refController.text : '',
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment recorded successfully!')));
      _refController.clear();
      _fetchOrderDetails();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment failed')));
    } finally {
      setState(() => _isCollectingPayment = false);
    }
  }

  Future<void> _openMap() async {
    final lat = _order['gpsLatitude'];
    final lng = _order['gpsLongitude'];
    if (lat != null && lng != null) {
      final url = 'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng';
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      }
    } else {
       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No GPS location available')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_order == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Order not found')));

    final user = Provider.of<AuthProvider>(context, listen: false).user;
    final isAssignedToOther = _order['driverId'] != null && _order['driverId'] != user?.id;
    final isDelivered = _order['status'] == 'Delivered';
    final isApproved = _order['status'] == 'Approved';
    final rawPending = _order['Invoice']?['balanceAmount'] ?? _order['totalAmount'];
    final pendingAmount = rawPending is String ? double.tryParse(rawPending) ?? 0.0 : (rawPending ?? 0).toDouble();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Delivery Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
            Text('Order #${widget.orderId}', style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            if (isAssignedToOther) _buildWarningBanner(),
            const SizedBox(height: 16),
            _buildRetailerCard(isDelivered, isApproved),
            const SizedBox(height: 24),
            if (!isAssignedToOther) ...[
              if (isApproved) _buildActionButton('Confirm Item Pickup', LucideIcons.truck, const [Color(0xFFF59E0B), Color(0xFFD97706)], () => _updateStatus('Dispatched')),
              const SizedBox(height: 16),
              if (!isDelivered) _buildActionButton('Complete Delivery', LucideIcons.checkCircle, [const Color(0xFF1E293B), const Color(0xFF0F172A)], () => _updateStatus('Delivered')),
              if (isDelivered) ...[
                const SizedBox(height: 24),
                _buildPaymentCollection(pendingAmount),
              ],
            ],
            const SizedBox(height: 24),
            _buildSummaryCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildWarningBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFFEE2E2))),
      child: const Row(
        children: [
          Icon(LucideIcons.alertCircle, color: Color(0xFFEF4444)),
          SizedBox(width: 12),
          Expanded(child: Text('This order is assigned to another delivery partner.', style: TextStyle(color: Color(0xFF991B1B), fontWeight: FontWeight.bold, fontSize: 13))),
        ],
      ),
    );
  }

  Widget _buildRetailerCard(bool isDelivered, bool isApproved) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(40),
        boxShadow: [BoxShadow(color: const Color(0xFF1E293B).withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_order['retailer']?['shopName'] ?? 'Unknown', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), height: 1.1)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(LucideIcons.user, size: 14, color: Color(0xFF3B82F6)),
                        const SizedBox(width: 8),
                        Text(_order['retailer']?['ownerName'] ?? '', style: const TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: (isDelivered ? const Color(0xFF10B981) : const Color(0xFF3B82F6)).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _order['status'].toString().toUpperCase(),
                  style: TextStyle(color: isDelivered ? const Color(0xFF10B981) : const Color(0xFF3B82F6), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFF1F5F9))),
            child: Row(
              children: [
                const Icon(LucideIcons.mapPin, size: 18, color: Color(0xFF94A3B8)),
                const SizedBox(width: 12),
                Expanded(child: Text(_order['retailer']?['address'] ?? 'No address', style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w600))),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _openMap,
                  icon: const Icon(LucideIcons.navigation, size: 16),
                  label: const Text('DIRECTIONS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E293B),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              InkWell(
                onTap: () => launchUrl(Uri.parse('tel:${_order['retailer']?['phone']}')),
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFDBEAFE))),
                  child: const Icon(LucideIcons.phone, color: Color(0xFF2563EB)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, List<Color> gradient, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: gradient),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: gradient[0].withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 24),
            const SizedBox(width: 12),
            Text(label.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentCollection(double pendingAmount) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(40), border: Border.all(color: const Color(0xFFECFDF5))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(10)), child: const Icon(LucideIcons.indianRupee, size: 20, color: Color(0xFF059669))),
              const SizedBox(width: 12),
              const Text('COLLECTION', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(24), border: Border.all(color: const Color(0xFFDCFCE7))),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('PENDING BILL', style: TextStyle(color: Color(0xFF065F46), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                const SizedBox(width: 8),
                Expanded(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerRight,
                    child: Text('₹${pendingAmount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF065F46))),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          if (pendingAmount > 0) ...[
            const Text('PAYMENT MODE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
            const SizedBox(height: 12),
            Row(
              children: ['Cash', 'UPI', 'Cheque'].map((mode) {
                final isSelected = _paymentMode == mode;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: InkWell(
                      onTap: () => setState(() => _paymentMode = mode),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF059669) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(child: Text(mode, style: TextStyle(color: isSelected ? Colors.white : const Color(0xFF64748B), fontSize: 11, fontWeight: FontWeight.w900))),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Received Amount', prefixIcon: Icon(LucideIcons.indianRupee)),
            ),
            if (_paymentMode != 'Cash') ...[
              const SizedBox(height: 16),
              TextField(
                controller: _refController,
                decoration: InputDecoration(hintText: 'Enter $_paymentMode Ref #', labelText: 'Reference ID'),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isCollectingPayment ? null : _submitPayment,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 18), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                child: _isCollectingPayment ? const CircularProgressIndicator(color: Colors.white) : const Text('SUBMIT PAYMENT', style: TextStyle(fontWeight: FontWeight.w900)),
              ),
            ),
          ] else _buildClearedBanner(),
        ],
      ),
    );
  }

  Widget _buildClearedBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(20)),
      child: const Row(
        children: [
          Icon(LucideIcons.checkCircle, color: Color(0xFF10B981)),
          SizedBox(width: 12),
          Text('Payment cleared for this order.', style: TextStyle(color: Color(0xFF065F46), fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(32), border: Border.all(color: const Color(0xFFF1F5F9))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('ORDER SUMMARY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: 1)),
          const SizedBox(height: 20),
          _buildSummaryRow('Order Method', _order['paymentMode'] ?? 'Credit'),
          const Divider(height: 24, color: Color(0xFFF8FAFC), thickness: 2),
          _buildSummaryRow('Scheduled Date', DateFormat('dd MMM yyyy').format(DateTime.parse(_order['createdAt']))),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.w700, fontSize: 13)),
        const SizedBox(width: 8),
        Expanded(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerRight,
            child: Text(value, style: const TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w900, fontSize: 13)),
          ),
        ),
      ],
    );
  }
}
