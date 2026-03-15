import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../models/user.dart';
import 'delivery_details_screen.dart';
import 'delivery_details_screen.dart';

class MyDeliveriesScreen extends StatefulWidget {
  const MyDeliveriesScreen({super.key});

  @override
  State<MyDeliveriesScreen> createState() => _MyDeliveriesScreenState();
}

class _MyDeliveriesScreenState extends State<MyDeliveriesScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _deliveries = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _searchTerm = '';

  @override
  void initState() {
    super.initState();
    _fetchDeliveries();
  }

  Future<void> _fetchDeliveries() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final response = await _apiService.get('/orders');
      if (response.statusCode == 200) {
        setState(() {
          final responseData = response.data;
          if (responseData is Map) {
            _deliveries = responseData['data'] ?? [];
          } else {
            _deliveries = responseData;
          }
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'Server error: ${response.statusCode}';
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching deliveries: $e');
      String message = 'Failed to load deliveries.';
      if (e is DioException) {
        if (e.response?.data is Map && e.response?.data?['message'] != null) {
          message = e.response?.data['message'];
        } else if (e.message != null) {
          message = e.message!;
        }
      }
      setState(() {
        _errorMessage = message;
        _isLoading = false;
      });
    }
  }
  
  Future<void> _openMap(double? lat, double? lng) async {
    if (lat != null && lng != null) {
      final url = 'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng';
      try {
        if (await canLaunchUrl(Uri.parse(url))) {
          await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Could not open map application')),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Error launching map')),
          );
        }
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('GPS location not available for this retailer')),
        );
      }
    }
  }

  Future<void> _selfAssign(int orderId) async {
    try {
      final response = await _apiService.put('/orders/$orderId/assign');
      if (response.statusCode == 200) {
        _fetchDeliveries();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Delivery assigned to you')),
          );
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to assign delivery')),
      );
    }
  }

  List<dynamic> _getFilteredDeliveries(User? user) {
    return _deliveries.where((d) {
      final shopName = (d['retailer']?['shopName'] ?? '').toString().toLowerCase();
      final orderId = d['id'].toString().toLowerCase();
      final status = d['status'].toString();

      final matchesSearch = shopName.contains(_searchTerm.toLowerCase()) || orderId.contains(_searchTerm.toLowerCase());
      final isRelevantStatus = ['Approved', 'Dispatched', 'Delivered'].contains(status);

      return matchesSearch && isRelevantStatus;
    }).toList();
  }

  Map<String, dynamic> _getStatusStyle(String status) {
    switch (status) {
      case 'Approved':
        return {
          'color': const Color(0xFFF59E0B),
          'label': 'Awaiting Pickup',
          'icon': LucideIcons.clock,
          'gradient': [const Color(0xFFF59E0B), const Color(0xFFD97706)],
        };
      case 'Dispatched':
        return {
          'color': const Color(0xFF3B82F6),
          'label': 'On Route',
          'icon': LucideIcons.truck,
          'gradient': [const Color(0xFF3B82F6), const Color(0xFF2563EB)],
        };
      case 'Delivered':
        return {
          'color': const Color(0xFF10B981),
          'label': 'Delivered',
          'icon': LucideIcons.checkCircle,
          'gradient': [const Color(0xFF10B981), const Color(0xFF059669)],
        };
      default:
        return {
          'color': const Color(0xFF64748B),
          'label': status,
          'icon': LucideIcons.package,
          'gradient': [const Color(0xFF64748B), const Color(0xFF475569)],
        };
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final filteredDeliveries = _getFilteredDeliveries(user);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Daily Routes'),
        backgroundColor: Theme.of(context).cardTheme.color,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: Theme.of(context).textTheme.bodySmall?.color),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : _errorMessage != null
                ? _buildErrorState()
                : filteredDeliveries.isEmpty
                  ? _buildEmptyState()
                  : _buildDeliveryList(filteredDeliveries, user),
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
          hintText: 'Find shop or order ID...',
          prefixIcon: const Icon(LucideIcons.search, size: 20),
          contentPadding: const EdgeInsets.symmetric(vertical: 0),
          fillColor: Theme.of(context).scaffoldBackgroundColor,
          filled: true,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        ),
      ),
    );
  }

  Widget _buildDeliveryList(List<dynamic> deliveries, User? user) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: deliveries.length,
      itemBuilder: (context, index) {
        final delivery = deliveries[index];
        final isMyDelivery = delivery['driverId'] == user?.id;
        final statusStyle = _getStatusStyle(delivery['status']);
        final IconData statusIcon = statusStyle['icon'];

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardTheme.color,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
            boxShadow: [
              BoxShadow(
                color: Theme.of(context).brightness == Brightness.dark 
                    ? Colors.black.withOpacity(0.2) 
                    : const Color(0xFF1E293B).withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => DeliveryDetailsScreen(orderId: delivery['id']),
                ),
              );
            },
            child: Stack(
              children: [
                Positioned(
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 6,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: statusStyle['gradient'],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(22, 20, 20, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Wrap(
                                  crossAxisAlignment: WrapCrossAlignment.center,
                                  children: [
                                    Text('#${delivery['id']}', style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                                    if (isMyDelivery) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                                        child: Text('ASSIGNED TO YOU', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 8, fontWeight: FontWeight.w900)),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  delivery['retailer']?['shopName'] ?? 'Unknown',
                                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                                  overflow: TextOverflow.ellipsis,
                                  maxLines: 2,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: statusStyle['color'].withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Icon(statusIcon, size: 12, color: statusStyle['color']),
                                const SizedBox(width: 6),
                                Text(
                                  statusStyle['label'].toString().toUpperCase(),
                                  style: TextStyle(color: statusStyle['color'], fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: Theme.of(context).dividerColor.withOpacity(0.05), borderRadius: BorderRadius.circular(10)),
                            child: Icon(LucideIcons.mapPin, size: 16, color: Theme.of(context).hintColor),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              delivery['retailer']?['address'] ?? 'No address provided',
                              style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                      Divider(height: 32, color: Theme.of(context).dividerColor.withOpacity(0.05)),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Expanded(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(color: const Color(0xFFECFDF5), borderRadius: BorderRadius.circular(10)),
                                  child: const Icon(LucideIcons.indianRupee, size: 16, color: Color(0xFF10B981)),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Text('BILLING', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 9, fontWeight: FontWeight.w800)),
                                      FittedBox(
                                        fit: BoxFit.scaleDown,
                                        alignment: Alignment.centerLeft,
                                        child: Text(
                                          '₹${delivery['invoice']?['balanceAmount'] ?? delivery['totalAmount']}',
                                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          delivery['status'] == 'Approved'
                            ? _buildSelfAssignButton(delivery['id'])
                            : _buildActionButtons(delivery),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSelfAssignButton(int orderId) {
    return ElevatedButton(
      onPressed: () => _selfAssign(orderId),
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
        minimumSize: const Size(0, 40),
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('SELF ASSIGN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900)),
          SizedBox(width: 4),
          Icon(LucideIcons.chevronRight, size: 14),
        ],
      ),
    );
  }

  Widget _buildActionButtons(dynamic delivery) {
    return InkWell(
      onTap: () => _openMap(delivery['gpsLatitude'], delivery['gpsLongitude']),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(12)),
        child: const Icon(LucideIcons.navigation, color: Color(0xFF2563EB), size: 20),
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
            decoration: BoxDecoration(color: Theme.of(context).cardTheme.color, borderRadius: BorderRadius.circular(40)),
            child: Icon(LucideIcons.package, size: 60, color: Theme.of(context).dividerColor.withOpacity(0.05)),
          ),
          const SizedBox(height: 16),
          const Text('No Active Routes', style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.w900, fontSize: 20)),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'Currently there are no assignments available for dispatch.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.alertCircle, size: 60, color: Colors.redAccent),
            const SizedBox(height: 16),
            const Text(
              'Oops! Something went wrong',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'An unknown error occurred.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _fetchDeliveries,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}
