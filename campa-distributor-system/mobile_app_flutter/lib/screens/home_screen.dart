import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'dashboards/sales_dashboard.dart';
import 'dashboards/driver_dashboard.dart';
import 'dashboards/collection_dashboard.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final role = user?.role ?? 'sales_rep';

    switch (role) {
      case 'driver':
        return const DriverDashboard();
      case 'collection_agent':
        return const CollectionDashboard();
      case 'sales_rep':
      case 'admin':
      default:
        return const SalesDashboard();
    }
  }
}
