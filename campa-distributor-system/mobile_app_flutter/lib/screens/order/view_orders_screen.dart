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
          final responseData = response.data;
          if (responseData is Map) {
            _orders = responseData['data'] ?? [];
          } else {
            _orders = responseData;
          }
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
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).cardTheme.color,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: Theme.of(context).textTheme.bodySmall?.color),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Orders',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5, color: Theme.of(context).textTheme.titleLarge?.color),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(130), // Increased height for date picker
          child: Container(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              border: Border(bottom: BorderSide(color: Theme.of(context).dividerColor.withOpacity(0.05))),
            ),
            child: Column(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
                  ),
                  child: Row(
                    children: [
                      // Search
                      Expanded(
                        flex: 3,
                        child: Container(
                          height: 48,
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardTheme.color, // Changed from scaffoldBackgroundColor
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
                          ),
                          child: TextField(
                            onChanged: (value) => setState(() => _searchTerm = value),
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Theme.of(context).textTheme.bodyMedium?.color),
                            decoration: InputDecoration(
                              hintText: 'Search retailer or ID...',
                              hintStyle: TextStyle(color: Theme.of(context).hintColor, fontWeight: FontWeight.normal),
                              prefixIcon: Icon(LucideIcons.search, size: 18, color: Theme.of(context).hintColor),
                              suffixIcon: _searchTerm.isNotEmpty
                                  ? IconButton(
                                      icon: Icon(LucideIcons.x, size: 18, color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.5)),
                                      onPressed: () {
                                        setState(() {
                                          _searchTerm = '';
                                        });
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 14),
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
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardTheme.color,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.1)),
                          ),
                          child: DropdownButton<String>(
                            value: _filterStatus,
                            isExpanded: true,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            underline: const SizedBox.shrink(),
                            icon: Icon(LucideIcons.chevronDown, size: 20, color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.5)),
                            style: TextStyle(color: Theme.of(context).textTheme.bodyMedium?.color, fontWeight: FontWeight.bold),
                            dropdownColor: Theme.of(context).cardTheme.color,
                            items: ['All', 'Requested', 'Approved', 'Rejected'].map((s) => DropdownMenuItem(
                              value: s,
                              child: Text(s == 'Approved' ? 'Accepted' : (s == 'All' ? 'All Status' : s)),
                            )).toList(),
                            onChanged: (val) => setState(() => _filterStatus = val!),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                // Date Filter
                Container(
                  height: 44,
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
                  ),
                  child: Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      _buildDatePickerRow(true),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Text('→', style: TextStyle(color: Theme.of(context).hintColor, fontWeight: FontWeight.bold)),
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
                               color: Theme.of(context).colorScheme.error.withOpacity(0.1), // rose-50
                               borderRadius: BorderRadius.circular(8),
                             ),
                             child: Icon(LucideIcons.xCircle, size: 16, color: Theme.of(context).colorScheme.error), // rose-500
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
      body: CustomScrollView(
        slivers: [
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
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Icon(LucideIcons.calendar, size: 14, color: Theme.of(context).hintColor),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                date == null ? (isStart ? 'START' : 'END') : DateFormat('dd/MM/yyyy').format(date).toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: date == null ? Theme.of(context).hintColor : Theme.of(context).textTheme.bodyMedium?.color,
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
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
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
                   decoration: BoxDecoration(
                     gradient: LinearGradient(
                       begin: Alignment.topCenter,
                       end: Alignment.bottomCenter,
                       colors: [Theme.of(context).colorScheme.primary, Theme.of(context).colorScheme.secondary],
                     ),
                     borderRadius: const BorderRadius.only(
                       topLeft: Radius.circular(24),
                       bottomLeft: Radius.circular(24),
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
                                order['retailer']?['shopName'] ?? 'Unknown Shop',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  color: Theme.of(context).textTheme.titleLarge?.color,
                                ),
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
                                      color: Theme.of(context).dividerColor.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text('#${order['id']}', style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 12, fontWeight: FontWeight.bold)),
                                  ),
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(LucideIcons.calendar, size: 12, color: Theme.of(context).hintColor),
                                      const SizedBox(width: 4),
                                      Text(DateFormat('dd/MM/yyyy').format(parsedDate), style: TextStyle(color: Theme.of(context).hintColor, fontSize: 12, fontWeight: FontWeight.w500)),
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
                      decoration: BoxDecoration(
                        border: Border(top: BorderSide(color: Theme.of(context).dividerColor.withOpacity(0.1), style: BorderStyle.solid, width: 2)), // mimicking dashed
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('TOTAL AMOUNT', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                                const SizedBox(height: 2),
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text('₹${order['totalAmount']}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Theme.of(context).textTheme.titleLarge?.color)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Theme.of(context).dividerColor.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(LucideIcons.chevronRight, color: Theme.of(context).hintColor, size: 20),
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
          decoration: BoxDecoration(
            color: Theme.of(context).dividerColor.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(LucideIcons.fileText, size: 48, color: Theme.of(context).hintColor),
        ),
        const SizedBox(height: 16),
        Text('No orders found', style: TextStyle(color: Theme.of(context).textTheme.titleLarge?.color, fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 4),
        Text('Try adjusting your search or filters', style: TextStyle(color: Theme.of(context).hintColor, fontSize: 14)),
      ],
    );
  }
}
