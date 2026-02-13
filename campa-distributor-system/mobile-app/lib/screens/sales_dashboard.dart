import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/data_service.dart';
import 'create_order_screen.dart';
import 'order_list_screen.dart';

class SalesDashboard extends StatefulWidget {
  @override
  _SalesDashboardState createState() => _SalesDashboardState();
}

class _SalesDashboardState extends State<SalesDashboard> {
  int _currentIndex = 0;
  late List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      _DashboardStatsTab(),
      CreateOrderScreen(onOrderCreated: () {
        setState(() {
          _currentIndex = 2; // Switch to My Orders
        });
        Provider.of<DataService>(context, listen: false).fetchOrders();
      }),
      OrderListScreen(),
    ];
    Future.microtask(() =>
        Provider.of<DataService>(context, listen: false).fetchOrders());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
          // Refresh data when switching to Home or My Orders
          if (index == 0 || index == 2) {
             Provider.of<DataService>(context, listen: false).fetchOrders();
          }
        },
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_shopping_cart),
            label: 'New Order',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list_alt),
            label: 'My Orders',
          ),
        ],
      ),
    );
  }
}

class _DashboardStatsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final dataService = Provider.of<DataService>(context);
    final orders = dataService.orders;

    final requestedCount = orders.where((o) => o['status'] == 'Requested').length;
    final acceptedCount = orders.where((o) => o['status'] == 'Approved').length;
    final totalOrders = orders.length;

    // Calculate details safely
    double totalValue = 0;
    for (var o in orders) {
       totalValue += double.tryParse(o['totalAmount'].toString()) ?? 0.0;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard'),
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () => authService.logout(),
          ),
        ],
      ),
      body: dataService.isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome, ${authService.user?.name ?? 'Rep'}!',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 20),
                  _buildStatCard(
                    title: 'Requested Orders',
                    count: requestedCount.toString(),
                    color: Colors.orange,
                    icon: Icons.access_time,
                  ),
                  _buildStatCard(
                    title: 'Accepted Orders',
                    count: acceptedCount.toString(),
                    color: Colors.green,
                    icon: Icons.check_circle,
                  ),
                  _buildStatCard(
                    title: 'Total Orders',
                    count: totalOrders.toString(),
                    color: Colors.blue,
                    icon: Icons.receipt,
                  ),
                  _buildStatCard(
                    title: 'Total Value',
                    count: '₹${totalValue.toStringAsFixed(2)}',
                    color: Colors.purple,
                    icon: Icons.currency_rupee,
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard({required String title, required String count, required Color color, required IconData icon}) {
    return Card(
      elevation: 4,
      margin: EdgeInsets.symmetric(vertical: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 30),
            ),
            SizedBox(width: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  count,
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color),
                ),
                Text(
                  title,
                  style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
