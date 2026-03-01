import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import 'order_details_screen.dart';

class ViewOrdersScreen extends StatefulWidget {
  const ViewOrdersScreen({super.key});

  @override
  State<ViewOrdersScreen> createState() => _ViewOrdersScreenState();
}

class _ViewOrdersScreenState extends State<ViewOrdersScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _orders = [];
  bool _isLoading = true;
  String _searchTerm = '';
  String _filterStatus = 'All';
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      final Map<String, dynamic> params = {};
      if (_startDate != null) params['startDate'] = DateFormat('yyyy-MM-dd').format(_startDate!);
      if (_endDate != null) params['endDate'] = DateFormat('yyyy-MM-dd').format(_endDate!);

      final response = await _apiService.get('/orders', queryParameters: params);
      if (response.statusCode == 200) {
        setState(() {
          _orders = response.data;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching orders: $e');
      setState(() => _isLoading = false);
    }
  }

  List<dynamic> get _filteredOrders {
    return _orders.where((order) {
      final shopName = (order['retailer']?['shopName'] ?? '').toString().toLowerCase();
      final orderId = order['id'].toString().toLowerCase();
      final status = order['status'].toString();

      final matchesSearch = shopName.contains(_searchTerm.toLowerCase()) || orderId.contains(_searchTerm.toLowerCase());
      final matchesStatus = _filterStatus == 'All' || status == _filterStatus;

      return matchesSearch && matchesStatus;
    }).toList();
  }

  Color _getStatusColorText(String status) {
    switch (status) {
      case 'Approved': return const Color(0xFF047857); // emerald-700
      case 'Rejected': return const Color(0xFFBE123C); // rose-700
      case 'Requested': return const Color(0xFFB45309); // amber-700
      default: return const Color(0xFF334155); // slate-700
    }
  }

  Color _getStatusColorBg(String status) {
    switch (status) {
      case 'Approved': return const Color(0xFFD1FAE5); // emerald-100
      case 'Rejected': return const Color(0xFFFFE4E6); // rose-100
      case 'Requested': return const Color(0xFFFEF3C7); // amber-100
      default: return const Color(0xFFF1F5F9); // slate-100
    }
  }

  Color _getStatusColorBorder(String status) {
    switch (status) {
      case 'Approved': return const Color(0xFFA7F3D0); // emerald-200
      case 'Rejected': return const Color(0xFFFECDD3); // rose-200
      case 'Requested': return const Color(0xFFFDE68A); // amber-200
      default: return const Color(0xFFE2E8F0); // slate-200
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'Approved': return LucideIcons.checkCircle;
      case 'Rejected': return LucideIcons.xCircle;
      default: return LucideIcons.clock;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          // Sticky Top Header / Filters
          SliverAppBar(
            backgroundColor: Colors.white.withOpacity(0.9),
            elevation: 0,
            pinned: true,
            leading: IconButton(
              icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF334155)),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text(
              'My Orders',
              style: TextStyle(
                color: Color(0xFF1E293B),
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(130), // Increased height for date picker
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: const Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
                  boxShadow: [
                     BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))
                  ]
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        // Search
                        Expanded(
                          flex: 3,
                          child: Container(
                            height: 48,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9), // slate-100
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: TextField(
                              onChanged: (value) => setState(() => _searchTerm = value),
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                              decoration: const InputDecoration(
                                hintText: 'Search retailer or ID...',
                                hintStyle: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.normal),
                                prefixIcon: Icon(LucideIcons.search, size: 18, color: Color(0xFF94A3B8)),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(vertical: 14),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Status Filter
                        Expanded(
                          flex: 2,
                          child: Container(
                            height: 48,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      value: _filterStatus,
                                      icon: const SizedBox.shrink(), // Hide default icon
                                      isExpanded: true,
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                                      items: ['All', 'Requested', 'Approved', 'Rejected'].map((s) => DropdownMenuItem(
                                        value: s,
                                        child: Text(s == 'Approved' ? 'Accepted' : (s == 'All' ? 'All Status' : s)),
                                      )).toList(),
                                      onChanged: (val) => setState(() => _filterStatus = val!),
                                    ),
                                  ),
                                ),
                                const Icon(LucideIcons.filter, size: 16, color: Color(0xFF64748B)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Date Filter
                    Container(
                      height: 44,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          _buildDatePickerRow(true),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 4),
                            child: Text('→', style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
                          ),
                          _buildDatePickerRow(false),
                          if (_startDate != null || _endDate != null) ...[
                             const SizedBox(width: 4),
                             InkWell(
                               onTap: () {
                                 setState(() {
                                   _startDate = null;
                                   _endDate = null;
                                 });
                                 _fetchOrders();
                               },
                               child: Container(
                                 margin: const EdgeInsets.only(left: 4),
                                 padding: const EdgeInsets.all(6),
                                 decoration: BoxDecoration(
                                   color: const Color(0xFFFFF1F2), // rose-50
                                   borderRadius: BorderRadius.circular(8),
                                 ),
                                 child: const Icon(LucideIcons.xCircle, size: 16, color: Color(0xFFF43F5E)), // rose-500
                               ),
                             ),
                          ]
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // List Body
          SliverPadding(
           padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
           sliver: _isLoading 
              ? const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
              : _filteredOrders.isEmpty
                ? SliverFillRemaining(child: _buildEmptyState())
                : SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final order = _filteredOrders[index];
                        return _buildOrderCard(order);
                      },
                      childCount: _filteredOrders.length,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildDatePickerRow(bool isStart) {
    final date = isStart ? _startDate : _endDate;
    return InkWell(
      onTap: () async {
        final selected = await showDatePicker(
          context: context,
          initialDate: date ?? DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime.now(),
        );
        if (selected != null) {
          setState(() {
            if (isStart) _startDate = selected;
            else _endDate = selected;
          });
          _fetchOrders();
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.calendar, size: 14, color: Color(0xFF94A3B8)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                date == null ? (isStart ? 'START' : 'END') : DateFormat('dd/MM/yyyy').format(date).toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: date == null ? const Color(0xFF94A3B8) : const Color(0xFF334155),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderCard(dynamic order) {
    final status = order['status'].toString();
    final dateStr = order['createdAt'].toString();
    final parsedDate = DateTime.tryParse(dateStr) ?? DateTime.now();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
           BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2))
        ]
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => OrderDetailsScreen(orderId: order['id']),
              ),
            );
          },
          child: Stack(
            children: [
               // Left gradient accent
               Positioned(
                 left: 0,
                 top: 0,
                 bottom: 0,
                 width: 6,
                 child: Container(
                   decoration: const BoxDecoration(
                     gradient: LinearGradient(
                       begin: Alignment.topCenter,
                       end: Alignment.bottomCenter,
                       colors: [Color(0xFF3B82F6), Color(0xFF4F46E5)],
                     ),
                     borderRadius: BorderRadius.only(
                       topLeft: Radius.circular(16),
                       bottomLeft: Radius.circular(16),
                     ),
                   ),
                 ),
               ),
               Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                order['retailer']?['shopName'] ?? 'Unknown Retailer',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1E293B), height: 1.2),
                              ),
                              const SizedBox(height: 6),
                              Wrap(
                                crossAxisAlignment: WrapCrossAlignment.center,
                                spacing: 8,
                                runSpacing: 4,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text('#${order['id']}', style: const TextStyle(color: Color(0xFF475569), fontSize: 12, fontWeight: FontWeight.bold)),
                                  ),
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(LucideIcons.calendar, size: 12, color: Color(0xFF94A3B8)),
                                      const SizedBox(width: 4),
                                      Text(DateFormat('dd/MM/yyyy').format(parsedDate), style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500)),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStatusColorBg(status),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: _getStatusColorBorder(status)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(_getStatusIcon(status), size: 14, color: _getStatusColorText(status)),
                              const SizedBox(width: 4),
                              Text(
                                status == 'Approved' ? 'Accepted' : status,
                                style: TextStyle(color: _getStatusColorText(status), fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.only(top: 12),
                      decoration: const BoxDecoration(
                        border: Border(top: BorderSide(color: Color(0xFFF8FAFC), style: BorderStyle.solid, width: 2)), // mimicking dashed
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('TOTAL AMOUNT', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                                const SizedBox(height: 2),
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text('₹${order['totalAmount']}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: Color(0xFFF8FAFC),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(LucideIcons.chevronRight, color: Color(0xFF94A3B8), size: 20),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Color(0xFFF1F5F9),
            shape: BoxShape.circle,
          ),
          child: const Icon(LucideIcons.fileText, size: 48, color: Color(0xFFCBD5E1)),
        ),
        const SizedBox(height: 16),
        const Text('No orders found', style: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 4),
        const Text('Try adjusting your search or filters', style: TextStyle(color: Color(0xFF64748B), fontSize: 14)),
      ],
    );
  }
}
