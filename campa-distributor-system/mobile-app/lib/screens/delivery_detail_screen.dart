import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:geolocator/geolocator.dart';
import '../services/data_service.dart';
import '../services/location_service.dart';

class DeliveryDetailScreen extends StatefulWidget {
  final Map<String, dynamic> delivery;

  const DeliveryDetailScreen({Key? key, required this.delivery}) : super(key: key);

  @override
  _DeliveryDetailScreenState createState() => _DeliveryDetailScreenState();
}

class _DeliveryDetailScreenState extends State<DeliveryDetailScreen> {
  final LocationService _locationService = LocationService();
  bool _isUpdating = false;

  Future<void> _launchMaps() async {
    final invoice = widget.delivery['Invoice'];
    final retailer = invoice['Order']['retailer'];
    final lat = retailer['gpsLatitude'];
    final lng = retailer['gpsLongitude'];
    final address = retailer['address'];

    if (lat != null && lng != null) {
      final googleMapsUrl = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
      if (await canLaunchUrl(googleMapsUrl)) {
        await launchUrl(googleMapsUrl, mode: LaunchMode.externalApplication);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not open Maps')));
      }
    } else {
       // Fallback to address search
       final query = Uri.encodeComponent(address ?? '');
       final googleMapsUrl = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
        if (await canLaunchUrl(googleMapsUrl)) {
        await launchUrl(googleMapsUrl, mode: LaunchMode.externalApplication);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not open Maps')));
      }
    }
  }

  Future<void> _markAsDelivered() async {
    setState(() => _isUpdating = true);
    try {
      Position position = await _locationService.getCurrentLocation();
      await Provider.of<DataService>(context, listen: false).updateDeliveryStatus(
        widget.delivery['id'],
        'Delivered',
        position.latitude,
        position.longitude,
      );
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Marked as Delivered!')));
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final invoice = widget.delivery['Invoice'];
    final retailer = invoice['Order']['retailer'];
    final items = invoice['Order']['items'] as List<dynamic>? ?? [];
    final status = widget.delivery['status'];

    return Scaffold(
      appBar: AppBar(title: Text('Delivery Details')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            Card(
              color: status == 'Delivered' ? Colors.green[50] : Colors.orange[50],
              child: ListTile(
                title: Text('Status: $status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                subtitle: Text('Invoice #${invoice['id']}'),
                trailing: Icon(
                  status == 'Delivered' ? Icons.check_circle : Icons.local_shipping,
                  color: status == 'Delivered' ? Colors.green : Colors.orange,
                  size: 32,
                ),
              ),
            ),
            SizedBox(height: 20),
            
            // Address & Navigation
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(retailer['shopName'], style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    SizedBox(height: 10),
                    Text(retailer['address'] ?? 'No Address', style: TextStyle(fontSize: 16)),
                    SizedBox(height: 10),
                    Row(
                      children: [
                         Icon(Icons.phone, size: 16),
                         SizedBox(width: 5),
                         Text(retailer['phone'] ?? 'No Phone'),
                      ],
                    ),
                    SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: Icon(Icons.map),
                        label: Text('Navigate with Google Maps'),
                        style: ElevatedButton.styleFrom(
                           backgroundColor: Colors.blue,
                           foregroundColor: Colors.white,
                           padding: EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: _launchMaps,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 20),
            
            // Order Items
            Text('Items to Deliver', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ListView.builder(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              itemCount: items.length,
              itemBuilder: (ctx, i) {
                final item = items[i];
                return ListTile(
                  title: Text(item['Product']['name']),
                  trailing: Text('x${item['quantity']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                );
              },
            ),
            
            SizedBox(height: 30),
            if (status != 'Delivered')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(vertical: 16),
                  ),
                  onPressed: _isUpdating ? null : _markAsDelivered,
                   child: _isUpdating 
                      ? CircularProgressIndicator(color: Colors.white)
                      : Text('Mark as Delivered', style: TextStyle(fontSize: 18)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
