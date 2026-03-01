import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/quick_action_card.dart';
import '../collection/collect_payment_screen.dart';
import '../collection/payment_history_screen.dart';

class CollectionDashboard extends StatefulWidget {
  const CollectionDashboard({super.key});

  @override
  State<CollectionDashboard> createState() => _CollectionDashboardState();
}

class _CollectionDashboardState extends State<CollectionDashboard> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic> _stats = {
    'todayCollection': 0.0,
    'pendingInvoices': 0,
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
            'todayCollection': (response.data['todayCollection'] ?? 0).toDouble(),
            'pendingInvoices': response.data['pendingInvoices'] ?? 0,
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching collection stats: $e');
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
            _buildHeader(user?.name ?? 'Collection Agent'),
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
                      'COLLECTION TASKS',
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
                  gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Center(
                  child: Icon(LucideIcons.wallet, color: Colors.white, size: 32),
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Market Collection', style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontSize: 12)),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Hi, ${name.split(' ')[0]}!',
                        style: const TextStyle(color: Color(0xFF1E293B), fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
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
          title: 'Collected',
          value: '₹${(_stats['todayCollection'] / 1000).toStringAsFixed(1)}K',
          icon: LucideIcons.indianRupee,
          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
          subtext: 'Settled with Admin',
        ),
        StatCard(
          title: 'Open Bills',
          value: _stats['pendingInvoices'].toString(),
          icon: LucideIcons.clock,
          gradient: const [Color(0xFFF59E0B), Color(0xFFD97706)],
          subtext: 'Awaiting payment',
        ),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        QuickActionCard(
          title: 'Collect Payments',
          desc: 'Record new collections from retailers',
          icon: LucideIcons.wallet,
          gradient: const [Color(0xFF10B981), Color(0xFF059669)],
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const CollectPaymentScreen()),
            );
            _fetchStats();
          },
        ),
        const SizedBox(height: 16),
        QuickActionCard(
          title: 'Receipt Records',
          desc: 'Browse historical collection logs',
          icon: LucideIcons.history,
          gradient: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(builder: (context) => const PaymentHistoryScreen()),
            );
            _fetchStats();
          },
        ),
      ],
    );
  }
}
