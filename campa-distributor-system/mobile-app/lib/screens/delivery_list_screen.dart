import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/data_service.dart';

class DeliveryListScreen extends StatefulWidget {
  @override
  _DeliveryListScreenState createState() => _DeliveryListScreenState();
}

class _DeliveryListScreenState extends State<DeliveryListScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() =>
        Provider.of<DataService>(context, listen: false).fetchDeliveries());
  }

  @override
  Widget build(BuildContext context) {
    final dataService = Provider.of<DataService>(context);
    final deliveries = dataService.deliveries;

    return Scaffold(
      appBar: AppBar(title: Text('My Deliveries')),
      body: dataService.isLoading
          ? Center(child: CircularProgressIndicator())
          : deliveries.isEmpty
              ? Center(child: Text('No deliveries assigned.'))
              : ListView.builder(
                  itemCount: deliveries.length,
                  itemBuilder: (ctx, index) {
                    final delivery = deliveries[index];
                    final invoice = delivery['Invoice'];
                    final order = invoice?['Order'];
                    final retailer = order?['retailer'];
                    
                    final shopName = retailer?['shopName'] ?? 'Unknown Shop';
                    final address = retailer?['address'] ?? 'No Address';
                    final status = delivery['status'];
                    final deliveryId = delivery['id'];

                    return Card(
                      margin: EdgeInsets.all(8.0),
                      child: ListTile(
                        leading: Icon(Icons.local_shipping, color: Colors.blue),
                        title: Text(shopName),
                        subtitle: Text('Address: $address\nStatus: $status'),
                        trailing: Icon(Icons.arrow_forward_ios),
                        onTap: () {
                          // TODO: Navigate to Delivery Detail Screen
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Delivery Detail for #$deliveryId coming up!')),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
