import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/quick_action_card.dart';
import '../delivery/my_deliveries_screen.dart';
import '../collection/collect_payment_screen.dart';
import '../retailers_screen.dart';
import '../order/create_order_screen.dart';
import 'collection_dashboard.dart';
import '../profile_screen.dart';

class DriverDashboard extends StatefulWidget {
  const DriverDashboard({super.key});

  @override
  State<DriverDashboard> createState() => _DriverDashboardState();
}

class _DriverDashboardState extends State<DriverDashboard> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic> _stats = {
    'pending': 0,
    'dispatched': 0,
    'delivered': 0,
  };
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final response = await _apiService.get('/analytics/employee-stats');
      if (response.statusCode == 200) {
        setState(() {
          _stats = {
            'pending': response.data['pending'] ?? 0,
            'dispatched': response.data['dispatched'] ?? 0,
            'delivered': response.data['delivered'] ?? 0,
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching driver stats: $e');
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
            _buildHeader(user?.name ?? 'Driver'),
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
                      'LOGISTICS OPERAIONS',
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
      backgroundColor: Theme.of(context).cardTheme.color,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardTheme.color,
            borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(40), bottomRight: Radius.circular(40)),
          ),
          padding: const EdgeInsets.fromLTRB(24, 60, 24, 0),
          child: Row(
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF2563EB)]),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Center(
                  child: Icon(LucideIcons.truck, color: Colors.white, size: 32),
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Fleet Logistics', style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color, fontWeight: FontWeight.bold, fontSize: 12)),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Hi, ${name.split(' ')[0]}!',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5, color: Theme.of(context).textTheme.titleLarge?.color),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const ProfileScreen()),
                ),
                icon: Icon(LucideIcons.user, color: Theme.of(context).textTheme.bodySmall?.color),
              ),
              IconButton(
                onPressed: () => Provider.of<AuthProvider>(context, listen: false).logout(),
                icon: Icon(LucideIcons.logOut, color: Theme.of(context).textTheme.bodySmall?.color),
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
      childAspectRatio: 0.9,
      children: [
        StatCard(
          title: 'Pickups',
          value: _stats['pending'].toString(),
          icon: LucideIcons.package,
          gradient: const [Color(0xFFF59E0B), Color(0xFFD97706)],
          subtext: 'Ready for delivery',
        ),
        StatCard(
          title: 'Active',
          value: _stats['dispatched'].toString(),
          icon: LucideIcons.truck,
          gradient: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
          subtext: 'Currently on route',
        ),
        StatCard(
          title: 'Completed',
          value: _stats['delivered'].toString(),
          icon: LucideIcons.checkCircle,
          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
          subtext: 'Delivered today',
        ),
        StatCard(
          title: 'Efficiency',
          value: '98%',
          icon: LucideIcons.trendingUp,
          gradient: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
          subtext: 'On-time delivery',
        ),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        QuickActionCard(
          title: 'My Deliveries',
          desc: 'View current tasks and manage route',
          icon: LucideIcons.package,
          gradient: [Theme.of(context).primaryColor, Theme.of(context).primaryColor.withOpacity(0.8)],
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const MyDeliveriesScreen()),
            );
            _fetchStats();
          },
        ),
        const SizedBox(height: 16),
        QuickActionCard(
          title: 'Create Order',
          desc: 'Log a new order while on route',
          icon: LucideIcons.mapPin,
          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => CreateOrderScreen()),
            );
            _fetchStats();
          },
        ),
        const SizedBox(height: 16),
        QuickActionCard(
          title: 'Payments',
          desc: 'Record bill payments from retailers',
          icon: LucideIcons.creditCard,
          gradient: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const CollectPaymentScreen()),
            );
            _fetchStats();
          },
        ),
        const SizedBox(height: 16),
        QuickActionCard(
          title: 'Collection Dashboard',
          desc: 'View collection stats and history',
          icon: LucideIcons.layoutDashboard,
          gradient: const [Color(0xFFF59E0B), Color(0xFFD97706)],
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
