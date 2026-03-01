import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/quick_action_card.dart';
import '../retailers_screen.dart';
import '../order/view_orders_screen.dart';
import '../order/create_order_screen.dart';
import '../collection/collect_payment_screen.dart';
import '../dashboards/collection_dashboard.dart';

class SalesDashboard extends StatefulWidget {
  const SalesDashboard({super.key});

  @override
  State<SalesDashboard> createState() => _SalesDashboardState();
}

class _SalesDashboardState extends State<SalesDashboard> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic> _stats = {
    'totalOrders': 0,
    'requested': 0,
    'accepted': 0,
    'totalAmount': 0.0,
  };
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final response = await _apiService.get('/orders');
      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = response.data;
        final List<dynamic> orders = responseData['data'] ?? [];
        final double totalAmount = (responseData['totalSumAmount'] ?? 0).toDouble();
        
        final requested = orders.where((o) => o['status'] == 'Requested').length;
        final accepted = orders.where((o) => o['status'] == 'Approved').length;

        setState(() {
          _stats = {
            'totalOrders': responseData['total'] ?? orders.length,
            'requested': requested,
            'accepted': accepted,
            'totalAmount': totalAmount,
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching sales stats: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _fetchStats,
        child: CustomScrollView(
          slivers: [
            _buildHeader(user?.name ?? 'Sales Rep'),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _isLoading 
                      ? const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()))
                      : _buildStatsGrid(),
                    const SizedBox(height: 40),
                    const Text(
                      'QUICK ACTIONS',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF94A3B8),
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildQuickActions(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(String name) {
    return SliverAppBar(
      expandedHeight: 180,
      floating: false,
      pinned: true,
      backgroundColor: Colors.white,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(bottomLeft: Radius.circular(40), bottomRight: Radius.circular(40)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 60, 24, 0),
          child: Row(
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF4F46E5)]),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10)),
                  ],
                ),
                child: Center(
                  child: Text(
                    name.substring(0, 1).toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Welcome back,', style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontSize: 12)),
                    Text(
                      name,
                      style: const TextStyle(color: Color(0xFF1E293B), fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () => Provider.of<AuthProvider>(context, listen: false).logout(),
                icon: const Icon(LucideIcons.logOut, color: Color(0xFFCBD5E1)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 0.85, 
      children: [
        StatCard(
          title: 'Total Orders',
          value: _stats['totalOrders'].toString(),
          icon: LucideIcons.fileText,
          gradient: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
          subtext: 'Lifetime total',
        ),
        StatCard(
          title: 'Pending',
          value: _stats['requested'].toString(),
          icon: LucideIcons.clock,
          gradient: const [Color(0xFFF59E0B), Color(0xFFD97706)],
          subtext: 'Awaiting approval',
        ),
        StatCard(
          title: 'Accepted',
          value: _stats['accepted'].toString(),
          icon: LucideIcons.checkCircle,
          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
          subtext: 'Delivered orders',
        ),
        StatCard(
          title: 'Revenue',
          value: '₹${(_stats['totalAmount'] / 1000).toStringAsFixed(1)}K',
          icon: LucideIcons.indianRupee,
          gradient: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
          subtext: 'Gross earnings',
        ),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        QuickActionCard(
          title: 'New Order',
          desc: 'Create a new order for a retailer',
          icon: LucideIcons.shoppingCart,
          gradient: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const CreateOrderScreen()),
            );
            _fetchStats();
          },
        ),
        const SizedBox(height: 16),
        QuickActionCard(
          title: 'Track Orders',
          desc: 'View status of all your orders',
          icon: LucideIcons.package,
          gradient: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const ViewOrdersScreen()),
            );
            _fetchStats();
          },
        ),
        const SizedBox(height: 16),
        QuickActionCard(
          title: 'Retailers',
          desc: 'Manage and add new retailers',
          icon: LucideIcons.users,
          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (context) => const RetailersScreen()),
          ),
        ),
        const SizedBox(height: 16),
        QuickActionCard(
          title: 'Payments',
          desc: 'Collect and view payments',
          icon: LucideIcons.indianRupee,
          gradient: const [Color(0xFFF59E0B), Color(0xFFEA580C)],
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const CollectPaymentScreen()),
            );
            _fetchStats();
          },
        ),
        const SizedBox(height: 16),
        QuickActionCard(
          title: 'Collection',
          desc: 'View collection dashboard',
          icon: LucideIcons.fileText,
          gradient: const [Color(0xFFEC4899), Color(0xFFE11D48)],
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const CollectionDashboard()),
            );
            _fetchStats();
          },
        ),
      ],
    );
  }
}
