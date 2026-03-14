import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/retailer.dart';
import 'order/create_order_screen.dart';
import '../services/api_service.dart';

class RetailersScreen extends StatefulWidget {
  const RetailersScreen({super.key});

  @override
  State<RetailersScreen> createState() => _RetailersScreenState();
}

class _RetailersScreenState extends State<RetailersScreen> {
  final ApiService _apiService = ApiService();
  final _searchController = TextEditingController();
  List<Retailer> _retailers = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchRetailers();
  }

  Future<void> _fetchRetailers() async {
    try {
      final response = await _apiService.get('/retailers?limit=5000');
      if (response.statusCode == 200) {
        final responseData = response.data;
        final List<dynamic> data = responseData is Map && responseData.containsKey('data') 
            ? responseData['data'] 
            : responseData;
            
        setState(() {
          _retailers = data.map((item) => Retailer.fromJson(item)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching retailers: $e');
      setState(() => _isLoading = false);
    }
  }

  List<Retailer> get _filteredRetailers {
    if (_searchQuery.isEmpty) return _retailers;
    final query = _searchQuery.toLowerCase();
    return _retailers.where((r) =>
      (r.shopName.toLowerCase().contains(query)) ||
      (r.ownerName.toLowerCase().contains(query)) ||
      (r.phone.contains(query)) || 
      (r.id.toString().contains(query))
    ).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: Theme.of(context).cardTheme.color,
            elevation: 0,
            pinned: true,
            leading: IconButton(
              icon: Icon(LucideIcons.arrowLeft, color: Theme.of(context).textTheme.bodySmall?.color),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Text(
              'Retailers',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(80),
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardTheme.color,
                  border: Border(bottom: BorderSide(color: Theme.of(context).dividerColor.withOpacity(0.05))),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (value) => setState(() => _searchQuery = value),
                    style: TextStyle(fontWeight: FontWeight.w600, color: Theme.of(context).textTheme.bodyLarge?.color),
                    decoration: InputDecoration(
                      hintText: 'Search by shop, owner, or phone...',
                      hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.normal),
                      prefixIcon: const Icon(LucideIcons.search, size: 20, color: Color(0xFF94A3B8)),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 16),
                      suffixIcon: _searchQuery.isNotEmpty 
                        ? IconButton(
                            icon: const Icon(LucideIcons.x, size: 16, color: Color(0xFF94A3B8)),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
            sliver: _isLoading
              ? const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                )
              : _filteredRetailers.isEmpty
                  ? SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).dividerColor.withOpacity(0.05),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(LucideIcons.store, size: 48, color: Color(0xFFCBD5E1)),
                            ),
                            const SizedBox(height: 24),
                            const Text(
                              'No retailers found',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF334155),
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Try adjusting your search or add a\nnew retailer to get started.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final retailer = _filteredRetailers[index];
                          return _RetailerCard(retailer: retailer);
                        },
                        childCount: _filteredRetailers.length,
                      ),
                    ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => const CreateOrderScreen(),
            ),
          );
        },
        backgroundColor: const Color(0xFF0F172A),
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: const Icon(LucideIcons.userPlus, color: Colors.white),
      ),
    );
  }
}

class _RetailerCard extends StatelessWidget {
  final Retailer retailer;

  const _RetailerCard({required this.retailer});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).dividerColor.withOpacity(0.05)),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).brightness == Brightness.dark 
                ? Colors.black.withOpacity(0.2) 
                : const Color(0xFF1E293B).withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Gradient Accent
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
                  topLeft: Radius.circular(24),
                  bottomLeft: Radius.circular(24),
                ),
              ),
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFF3B82F6), Color(0xFF4F46E5)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF3B82F6).withOpacity(0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            retailer.shopName.isNotEmpty ? retailer.shopName[0].toUpperCase() : 'S',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Text(
                                    retailer.shopName,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      height: 1.2,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: retailer.creditBalance > 0 ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: retailer.creditBalance > 0 ? const Color(0xFFFECDD3) : const Color(0xFFBBF7D0),
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        'CREDIT',
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 0.5,
                                          color: retailer.creditBalance > 0 ? const Color(0xFFE11D48) : const Color(0xFF059669),
                                        ),
                                      ),
                                      Text(
                                        '₹${retailer.creditBalance.toStringAsFixed(2)}',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w900,
                                          color: retailer.creditBalance > 0 ? const Color(0xFFE11D48) : const Color(0xFF059669),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF94A3B8),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  retailer.ownerName.isEmpty ? 'Owner' : retailer.ownerName,
                                  style: const TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.only(left: 72),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      InkWell(
                        onTap: () async {
                          if (retailer.phone.isNotEmpty) {
                            final Uri uri = Uri(scheme: 'tel', path: retailer.phone);
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(uri);
                            }
                          }
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                          child: Wrap(
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFECFDF5),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(LucideIcons.phone, size: 16, color: Color(0xFF059669)),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                retailer.phone.isEmpty ? 'N/A' : retailer.phone,
                                style: const TextStyle(
                                  color: Color(0xFF475569),
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            margin: const EdgeInsets.only(left: 8),
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEEF2FF),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(LucideIcons.mapPin, size: 16, color: Color(0xFF6366F1)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(
                                retailer.address.isEmpty ? 'No address provided' : retailer.address,
                                style: const TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
