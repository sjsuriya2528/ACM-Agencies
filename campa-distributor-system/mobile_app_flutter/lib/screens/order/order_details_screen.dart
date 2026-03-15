import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../collection/invoice_view_screen.dart';

class OrderDetailsScreen extends StatefulWidget {
  final int orderId;
  const OrderDetailsScreen({super.key, required this.orderId});

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  final ApiService _apiService = ApiService();
  dynamic _order;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrder();
  }

  Future<void> _fetchOrder() async {
    try {
      final response = await _apiService.get('/orders/${widget.orderId}');
      if (response.statusCode == 200) {
        setState(() {
          _order = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching order: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_order == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Order not found')));

    final status = _order['status'];
    final createdAt = DateTime.parse(_order['createdAt']);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Text('Order #${widget.orderId}'),
        backgroundColor: Theme.of(context).cardTheme.color,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: Theme.of(context).textTheme.bodySmall?.color),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildStatusCard(status, createdAt),
            const SizedBox(height: 16),
            _buildRetailerCard(),
            const SizedBox(height: 16),
            _buildItemsCard(),
            if (_order['invoice'] != null) ...[
              _buildSectionTitle(LucideIcons.fileText, 'Invoice Details'),
              _buildInvoiceCard(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(String status, DateTime date) {
    Color statusColor;
    IconData statusIcon;
    switch (status) {
      case 'Approved':
        statusColor = const Color(0xFF10B981);
        statusIcon = LucideIcons.checkCircle;
        break;
      case 'Rejected':
        statusColor = const Color(0xFFEF4444);
        statusIcon = LucideIcons.xCircle;
        break;
      case 'Requested':
        statusColor = const Color(0xFFF59E0B);
        statusIcon = LucideIcons.clock;
        break;
      default:
        statusColor = const Color(0xFF64748B);
        statusIcon = LucideIcons.clock;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Theme.of(context).cardTheme.color, borderRadius: BorderRadius.circular(24), border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05))),
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 16,
        runSpacing: 16,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('STATUS', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, size: 14, color: statusColor),
                    const SizedBox(width: 6),
                    Text(status == 'Approved' ? 'ACCEPTED' : status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w900)),
                  ],
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text('ORDER STATUS', style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              const SizedBox(height: 4),
              Text(
                _order['status'].toUpperCase(),
                style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5),
              ),
              Text(DateFormat('hh:mm a').format(date), style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRetailerCard() {
    final r = _order['retailer'];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Theme.of(context).cardTheme.color, borderRadius: BorderRadius.circular(24), border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.mapPin, size: 18, color: Color(0xFF3B82F6)),
              SizedBox(width: 8),
              Text('RETAILER DETAILS', style: TextStyle(color: Color(0xFF1E293B), fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
            ],
          ),
          const SizedBox(height: 16),
          Text(r?['shopName'] ?? 'Unknown', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text(r?['ownerName'] ?? '', style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 12),
          Text(r?['address'] ?? '', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13, height: 1.4)),
          const SizedBox(height: 4),
          Text(r?['phone'] ?? '', style: const TextStyle(color: Color(0xFF3B82F6), fontWeight: FontWeight.w900, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildItemsCard() {
    final items = _order['items'] as List<dynamic>;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Theme.of(context).cardTheme.color, borderRadius: BorderRadius.circular(24), border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.package, size: 18, color: Color(0xFF8B5CF6)),
              SizedBox(width: 8),
              Text('ORDER ITEMS', style: TextStyle(color: Color(0xFF1E293B), fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
            ],
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            separatorBuilder: (context, index) => Divider(height: 24, color: Theme.of(context).dividerColor.withOpacity(0.05)),
            itemBuilder: (context, index) {
              final item = items[index];
              final product = item['Product'];
              final bottlesPerCrate = product?['bottlesPerCrate'] ?? 24;
              final quantity = item['quantity'] as int;
              final crates = quantity ~/ bottlesPerCrate;
              final pieces = quantity % bottlesPerCrate;

              return Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(product?['name'] ?? 'Unknown Product', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                        const SizedBox(height: 4),
                        Text(
                          '${crates > 0 ? '$crates Crates ' : ''}${pieces > 0 ? '$pieces Pieces' : (crates == 0 ? '0 Pieces' : '')} • ₹${item['pricePerUnit']} / unit',
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  Text('₹${item['totalPrice']}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                ],
              );
            },
          ),
          Divider(height: 40, color: Theme.of(context).dividerColor.withOpacity(0.1), thickness: 2),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Text('TOTAL AMOUNT', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF94A3B8), fontSize: 12)),
              const SizedBox(width: 8),
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerRight,
                  child: Text('₹${_order['totalAmount']}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF3B82F6), fontSize: 24)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(IconData icon, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 24, 0, 16),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 12),
          Text(
            title.toUpperCase(),
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1, color: Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }

  Widget _buildInvoiceCard() {
    final inv = _order['invoice'];
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('INVOICE #', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(inv['invoiceNumber'] ?? inv['id'].toString(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('PAYMENT STATUS', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (inv['paymentStatus'] == 'Paid' ? const Color(0xFF10B981) : const Color(0xFFF59E0B)).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      inv['paymentStatus'].toString().toUpperCase(),
                      style: TextStyle(
                        color: inv['paymentStatus'] == 'Paid' ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildInvoiceAction(),
        ],
      ),
    );
  }

  Widget _buildInvoiceAction() {
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => InvoiceViewScreen(invoiceId: _order['invoice']['id']),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF4F46E5)]),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: const Color(0xFF3B82F6).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))],
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.fileText, color: Colors.white, size: 20),
            SizedBox(width: 12),
            Text('VIEW MAIN BILL', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }
}
