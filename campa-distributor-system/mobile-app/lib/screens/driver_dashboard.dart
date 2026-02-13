import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/data_service.dart';
import '../services/auth_service.dart';
import 'delivery_detail_screen.dart';

class DriverDashboard extends StatefulWidget {
  @override
  _DriverDashboardState createState() => _DriverDashboardState();
}

class _DriverDashboardState extends State<DriverDashboard> {
  int _currentIndex = 0;
  late List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      _DriverStatsTab(),
      _DriverDeliveriesTab(),
    ];
    Future.microtask(() =>
        Provider.of<DataService>(context, listen: false).fetchDeliveries());
  }

  @override
  Widget build(BuildContext context) {
    final dataService = Provider.of<DataService>(context);
    
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
          if (index == 1) {
             dataService.fetchDeliveries();
          }
        },
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping),
            label: 'Deliveries',
          ),
        ],
      ),
    );
  }
}

class _DriverStatsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final dataService = Provider.of<DataService>(context);
    final deliveries = dataService.deliveries;
    
    final user = authService.user;
    final pendingCount = deliveries.where((d) => d['status'] != 'Delivered').length;
    final deliveredCount = deliveries.where((d) => d['status'] == 'Delivered').length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Driver Dashboard'),
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
                    'Welcome, ${user?.name ?? "Driver"}!',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 5),
                  Text(
                    'Role: ${user?.role ?? "Driver"}',
                    style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                  ),
                  SizedBox(height: 20),
                  _buildStatCard(
                    title: 'Pending Deliveries',
                    count: pendingCount.toString(),
                    color: Colors.orange,
                    icon: Icons.pending_actions,
                  ),
                  _buildStatCard(
                    title: 'Delivered',
                    count: deliveredCount.toString(),
                    color: Colors.green,
                    icon: Icons.check_circle,
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

class _DriverDeliveriesTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final dataService = Provider.of<DataService>(context);
    final deliveries = dataService.deliveries;
    
    final pendingDeliveries = deliveries.where((d) => d['status'] != 'Delivered').toList();
    final completedDeliveries = deliveries.where((d) => d['status'] == 'Delivered').toList();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text('My Deliveries'),
          bottom: TabBar(
            tabs: [
              Tab(text: 'Pending (${pendingDeliveries.length})'),
              Tab(text: 'Delivered (${completedDeliveries.length})'),
            ],
          ),
          actions: [
             IconButton(
              icon: Icon(Icons.refresh),
              onPressed: () => dataService.fetchDeliveries(),
            ),
          ],
        ),
        body: dataService.isLoading
            ? Center(child: CircularProgressIndicator())
            : TabBarView(
                children: [
                  _buildDeliveryList(context, pendingDeliveries),
                  _buildDeliveryList(context, completedDeliveries),
                ],
              ),
      ),
    );
  }

  Widget _buildDeliveryList(BuildContext context, List<dynamic> list) {
    if (list.isEmpty) {
      return Center(child: Text('No deliveries found.', style: TextStyle(color: Colors.grey)));
    }
    return ListView.builder(
      padding: EdgeInsets.all(10),
      itemCount: list.length,
      itemBuilder: (ctx, index) {
        final delivery = list[index];
        final invoice = delivery['Invoice'];
        final retailer = invoice['Order']['retailer'];
        final status = delivery['status'];
        final address = retailer['address'] ?? 'No Address';

        return Card(
          margin: EdgeInsets.symmetric(vertical: 8),
          elevation: 3,
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: status == 'Delivered' ? Colors.green : Colors.orange,
              child: Icon(
                status == 'Delivered' ? Icons.check : Icons.local_shipping,
                color: Colors.white,
              ),
            ),
            title: Text(retailer['shopName']),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(address, maxLines: 2, overflow: TextOverflow.ellipsis),
                SizedBox(height: 4),
                Text('Inv #${invoice['id']} • $status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ],
            ),
            trailing: Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => DeliveryDetailScreen(delivery: delivery),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
