import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'sales_dashboard.dart';
import 'driver_dashboard.dart';
import 'collector_dashboard.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final user = authService.user;

    // Route based on role
    if (user?.role == 'sales_rep') {
      return SalesDashboard();
    } else if (user?.role == 'driver') {
      return DriverDashboard();
    } else if (user?.role == 'collection_agent') {
      return CollectorDashboard();
    }

    // Default Fallback (for Admin or Unknown roles)
    return Scaffold(
      appBar: AppBar(
        title: Text('Campa Distributor'),
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () {
              authService.logout();
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Welcome, \${user?.name ?? "User"}!', style: TextStyle(fontSize: 20)),
            SizedBox(height: 10),
            Text('Role: \${user?.role ?? "Unknown"}', style: TextStyle(fontSize: 16, color: Colors.grey)),
            SizedBox(height: 20),
            Text('Mobile App is primarily for Field Staff.'),
            Text('(Sales Reps, Drivers, Collectors)'),
          ],
        ),
      ),
    );
  }
}
