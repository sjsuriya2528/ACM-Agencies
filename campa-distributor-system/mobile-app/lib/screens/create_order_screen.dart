import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../services/data_service.dart';
import '../services/location_service.dart';
import '../models/retailer.dart';
import '../models/product.dart';

class CreateOrderScreen extends StatefulWidget {
  final VoidCallback? onOrderCreated;

  const CreateOrderScreen({Key? key, this.onOrderCreated}) : super(key: key);

  @override
  _CreateOrderScreenState createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  final _formKey = GlobalKey<FormState>();
  final LocationService _locationService = LocationService();
  
  // Retailer Selection State
  final TextEditingController _searchController = TextEditingController();
  Retailer? _selectedRetailer;
  bool _showRetailerList = false;
  
  Map<int, Map<String, int>> _orderItems = {}; // ProductId -> { 'crates': 0, 'bottles': 0 }
  Position? _capturedPosition;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final dataService = Provider.of<DataService>(context, listen: false);
      dataService.fetchRetailers();
      dataService.fetchProducts();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _captureLocation() async {
    try {
      Position position = await _locationService.getCurrentLocation();
      setState(() {
        _capturedPosition = position;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Location Captured: ${position.latitude}, ${position.longitude}')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _showAddRetailerDialog(String initialName) {
    final _addFormKey = GlobalKey<FormState>();
    String shopName = initialName;
    String ownerName = '';
    String phone = '';
    String address = '';
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Add New Retailer'),
        content: Form(
          key: _addFormKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  initialValue: shopName,
                  decoration: InputDecoration(labelText: 'Shop Name'),
                  onSaved: (val) => shopName = val ?? '',
                  validator: (val) => val!.isEmpty ? 'Required' : null,
                ),
                TextFormField(
                  decoration: InputDecoration(labelText: 'Owner Name'),
                  onSaved: (val) => ownerName = val ?? '',
                  validator: (val) => val!.isEmpty ? 'Required' : null,
                ),
                TextFormField(
                  decoration: InputDecoration(labelText: 'Phone'),
                  keyboardType: TextInputType.phone,
                  onSaved: (val) => phone = val ?? '',
                  validator: (val) => val!.isEmpty ? 'Required' : null,
                ),
                TextFormField(
                  decoration: InputDecoration(labelText: 'Address'),
                  onSaved: (val) => address = val ?? '',
                  validator: (val) => val!.isEmpty ? 'Required' : null,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (_addFormKey.currentState!.validate()) {
                _addFormKey.currentState!.save();
                Navigator.of(ctx).pop(); // Close dialog immediately
                
                try {
                  setState(() => _isSubmitting = true);
                  final newRetailerReference = await Provider.of<DataService>(context, listen: false).createRetailer({
                    'shopName': shopName,
                    'ownerName': ownerName,
                    'phone': phone,
                    'address': address,
                    'gpsLatitude': _capturedPosition?.latitude,
                    'gpsLongitude': _capturedPosition?.longitude,
                  });
                  
                  setState(() {
                    _selectedRetailer = newRetailerReference;
                    _searchController.text = newRetailerReference.shopName;
                    _showRetailerList = false;
                    _isSubmitting = false;
                  });
                  
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Retailer Added!')));
                } catch (e) {
                  setState(() => _isSubmitting = false);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to add retailer: $e')));
                }
              }
            },
            child: Text('Add'),
          ),
        ],
      ),
    );
  }

  void _submitOrder() async {
    if (_selectedRetailer == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please select a retailer')));
      return;
    }
    
    // ... (keep item calculation logic)
    final itemsPayload = <Map<String, dynamic>>[];
    final dataService = Provider.of<DataService>(context, listen: false);
    
    for (var entry in _orderItems.entries) {
      final productId = entry.key;
      final quantities = entry.value;
      final crates = quantities['crates'] ?? 0;
      final bottles = quantities['bottles'] ?? 0;
      
      if (crates > 0 || bottles > 0) {
        final product = dataService.products.firstWhere((p) => p.id == productId);
        final totalBottles = (crates * product.bottlesPerCrate) + bottles;
        
        itemsPayload.add({
          'productId': productId,
          'quantity': totalBottles,
        });
      }
    }

    if (itemsPayload.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please add at least one product')));
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final orderData = {
        'retailerId': _selectedRetailer!.id,
        'items': itemsPayload,
        'gpsLatitude': _capturedPosition?.latitude,
        'gpsLongitude': _capturedPosition?.longitude,
      };

      await Provider.of<DataService>(context, listen: false).submitOrder(orderData);
      
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order Submitted Successfully!')));
      
      // Reset Form
      setState(() {
        _selectedRetailer = null;
        _searchController.clear();
        _orderItems.clear();
        _capturedPosition = null;
        _showRetailerList = false;
      });

      // Navigate
      if (widget.onOrderCreated != null) {
        widget.onOrderCreated!();
      } else {
        Navigator.pop(context);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Submission Failed: $e')));
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Widget _buildRetailerSearch(List<Retailer> retailers) {
    if (_selectedRetailer != null) {
      return Card(
        color: Colors.blue[50],
        child: ListTile(
          title: Text(_selectedRetailer!.shopName, style: TextStyle(fontWeight: FontWeight.bold)),
          subtitle: Text(_selectedRetailer!.address ?? 'No Address'),
          trailing: IconButton(
            icon: Icon(Icons.close),
            onPressed: () {
              setState(() {
                _selectedRetailer = null;
                _searchController.clear();
              });
            },
          ),
        ),
      );
    }

    final query = _searchController.text.toLowerCase();
    final filtered = retailers.where((r) => r.shopName.toLowerCase().contains(query)).toList();

    return Column(
      children: [
        TextField(
          controller: _searchController,
          decoration: InputDecoration(
            labelText: 'Search Retailer',
            border: OutlineInputBorder(),
            suffixIcon: Icon(Icons.search),
          ),
          onChanged: (val) {
            setState(() {
              _showRetailerList = val.isNotEmpty;
            });
          },
        ),
        if (_showRetailerList)
          Container(
            height: 200,
            decoration: BoxDecoration(border: Border.all(color: Colors.grey)),
            child: ListView(
              children: [
                ...filtered.map((r) => ListTile(
                  title: Text(r.shopName),
                  subtitle: Text(r.address ?? ''),
                  onTap: () {
                    setState(() {
                      _selectedRetailer = r;
                      _searchController.text = r.shopName;
                      _showRetailerList = false;
                    });
                  },
                )).toList(),
                if (query.isNotEmpty)
                  ListTile(
                    leading: Icon(Icons.add_circle, color: Colors.blue),
                    title: Text('Add New Retailer: "${_searchController.text}"'),
                    onTap: () => _showAddRetailerDialog(_searchController.text),
                  ),
              ],
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final dataService = Provider.of<DataService>(context);
    final retailers = dataService.retailers;
    final products = dataService.products;

    return Scaffold(
      appBar: AppBar(title: Text('Create Order')),
      body: dataService.isLoading
          ? Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  // Retailer Section
                  _buildRetailerSearch(retailers),
                  SizedBox(height: 10),
                  
                  // GPS Capture
                  ListTile(
                    tileColor: Colors.grey[100],
                    leading: Icon(Icons.location_on, color: _capturedPosition != null ? Colors.green : Colors.grey),
                    title: Text(_capturedPosition != null
                        ? 'GPS Captured'
                        : 'GPS Not Captured (Recommended)'),
                    subtitle: _capturedPosition != null
                        ? Text('${_capturedPosition!.latitude}, ${_capturedPosition!.longitude}')
                        : null,
                    trailing: TextButton(
                      onPressed: _captureLocation,
                      child: Text('Capture'),
                    ),
                  ),
                  SizedBox(height: 10),
                  
                  Divider(thickness: 2),
                  Text('Products', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  
                  // Product Selection List
                  Expanded(
                    child: ListView.builder(
                      itemCount: products.length,
                      itemBuilder: (ctx, index) {
                        final product = products[index];
                        final quantities = _orderItems[product.id] ?? {'crates': 0, 'bottles': 0};
                        final int crates = quantities['crates'] ?? 0;
                        final int bottles = quantities['bottles'] ?? 0;
                        final int totalBottles = (crates * product.bottlesPerCrate) + bottles;
                        final double totalPrice = totalBottles * product.price;
                        
                        return Card(
                          margin: EdgeInsets.symmetric(vertical: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(product.name, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                Text('Price: ₹${product.price}/bottle | ${product.bottlesPerCrate} bottles/crate'),
                                SizedBox(height: 8),
                                Wrap(
                                  spacing: 16.0,
                                  runSpacing: 8.0,
                                  alignment: WrapAlignment.spaceBetween,
                                  children: [
                                    // Crates Input
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text('Crates: '),
                                        IconButton(
                                            icon: Icon(Icons.remove_circle, color: Colors.red),
                                            onPressed: crates > 0 ? () {
                                              setState(() {
                                                if (!_orderItems.containsKey(product.id)) _orderItems[product.id] = {'crates': 0, 'bottles': 0};
                                                _orderItems[product.id]!['crates'] = crates - 1;
                                              });
                                            } : null),
                                        Text('$crates', style: TextStyle(fontSize: 16)),
                                        IconButton(
                                            icon: Icon(Icons.add_circle, color: Colors.green),
                                            onPressed: () {
                                              setState(() {
                                                 if (!_orderItems.containsKey(product.id)) _orderItems[product.id] = {'crates': 0, 'bottles': 0};
                                                 _orderItems[product.id]!['crates'] = crates + 1;
                                              });
                                            }),
                                      ],
                                    ),
                                    // Bottles Input
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text('Bottles: '),
                                        IconButton(
                                            icon: Icon(Icons.remove_circle, color: Colors.red),
                                            onPressed: bottles > 0 ? () {
                                              setState(() {
                                                if (!_orderItems.containsKey(product.id)) _orderItems[product.id] = {'crates': 0, 'bottles': 0};
                                                _orderItems[product.id]!['bottles'] = bottles - 1;
                                              });
                                            } : null),
                                        Text('$bottles', style: TextStyle(fontSize: 16)),
                                        IconButton(
                                            icon: Icon(Icons.add_circle, color: Colors.green),
                                            onPressed: () {
                                              setState(() {
                                                 if (!_orderItems.containsKey(product.id)) _orderItems[product.id] = {'crates': 0, 'bottles': 0};
                                                 _orderItems[product.id]!['bottles'] = bottles + 1;
                                              });
                                            }),
                                      ],
                                    ),
                                  ],
                                ),
                                if (totalBottles > 0)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 8.0),
                                    child: Text('Total: $totalBottles Bottles | ₹$totalPrice', 
                                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue)),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(padding: EdgeInsets.symmetric(vertical: 15)),
                      onPressed: _isSubmitting ? null : _submitOrder,
                      child: _isSubmitting ? CircularProgressIndicator() : Text('Submit Order (Items: ${_orderItems.length})'),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
