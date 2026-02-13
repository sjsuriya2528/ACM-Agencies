import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/data_service.dart';
import 'order_detail_screen.dart';

class OrderListScreen extends StatefulWidget {
  @override
  _OrderListScreenState createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() =>
        Provider.of<DataService>(context, listen: false).fetchOrders());
  }

  @override
  Widget build(BuildContext context) {
    final dataService = Provider.of<DataService>(context);
    final orders = dataService.orders;

    final requestedOrders = orders.where((o) => o['status'] == 'Requested').toList();
    final acceptedOrders = orders.where((o) => o['status'] == 'Approved').toList();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text('My Orders'),
          bottom: TabBar(
            tabs: [
              Tab(text: 'Requested'),
              Tab(text: 'Accepted'),
            ],
          ),
        ),
        body: dataService.isLoading
            ? Center(child: CircularProgressIndicator())
            : TabBarView(
                children: [
                  _buildOrderList(requestedOrders, 'No requested orders.'),
                  _buildOrderList(acceptedOrders, 'No accepted orders.'),
                ],
              ),
      ),
    );
  }

  Widget _buildOrderList(List<dynamic> orders, String emptyMessage) {
    if (orders.isEmpty) {
      return Center(child: Text(emptyMessage));
    }
    return ListView.builder(
      itemCount: orders.length,
      itemBuilder: (ctx, index) {
        final order = orders[index];
        final retailerName = order['retailer']?['shopName'] ?? 'Unknown Retailer';
        final totalAmount = order['totalAmount'];
        final status = order['status'];
        final date = order['createdAt'].toString().substring(0, 10);

        return Card(
          margin: EdgeInsets.all(8.0),
          child: ListTile(
            onTap: () {
              Navigator.push(
                ctx,
                MaterialPageRoute(
                  builder: (context) => OrderDetailScreen(order: order),
                ),
              );
            },
            leading: CircleAvatar(
              child: Text(retailerName.isNotEmpty ? retailerName[0] : '?'),
              backgroundColor: _getStatusColor(status),
              foregroundColor: Colors.white,
            ),
            title: Text(retailerName),
            subtitle: Text('Date: $date\nAmount: ₹$totalAmount'),
            trailing: Chip(
              label: Text(status),
              backgroundColor: _getStatusColor(status).withOpacity(0.2),
            ),
          ),
        );
      },
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'Approved':
        return Colors.green;
      case 'Rejected':
        return Colors.red;
      case 'Requested':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}
