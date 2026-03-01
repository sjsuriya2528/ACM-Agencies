import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:geolocator/geolocator.dart';
import '../../models/retailer.dart';
import '../../models/product.dart';
import '../../services/api_service.dart';

class CreateOrderScreen extends StatefulWidget {
  const CreateOrderScreen({super.key});

  @override
  State<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  final ApiService _apiService = ApiService();
  
  // Data
  List<Product> _products = [];
  List<Retailer> _retailers = [];
  final List<CartItem> _cart = [];
  
  // Selection State
  Retailer? _selectedRetailer;
  String _paymentMode = 'Credit'; // 'Credit' or 'Cash'
  bool _roundOffTotal = true;
  
  // Search State
  bool _isSearchingRetailer = false;
  String _retailerSearchQuery = '';
  final TextEditingController _retailerSearchController = TextEditingController();
  final FocusNode _retailerSearchFocus = FocusNode();

  String _productSearchQuery = '';
  final TextEditingController _productSearchController = TextEditingController();

  bool _isLoadingProducts = true;
  bool _isLoadingRetailers = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _fetchProducts();
    _fetchRetailers();
  }

  @override
  void dispose() {
    _retailerSearchController.dispose();
    _retailerSearchFocus.dispose();
    _productSearchController.dispose();
    super.dispose();
  }

  Future<void> _fetchProducts() async {
    try {
      final response = await _apiService.get('/products');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        if (mounted) {
          setState(() {
            _products = data.map((item) => Product.fromJson(item)).toList();
            _isLoadingProducts = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching products: $e');
      if (mounted) setState(() => _isLoadingProducts = false);
    }
  }

  Future<void> _fetchRetailers() async {
    try {
      final response = await _apiService.get('/retailers?limit=5000');
      if (response.statusCode == 200) {
        final responseData = response.data;
        final List<dynamic> data = responseData is Map && responseData.containsKey('data') 
            ? responseData['data'] 
            : responseData;
            
        if (mounted) {
          setState(() {
            _retailers = data.map((item) => Retailer.fromJson(item)).toList();
            _isLoadingRetailers = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching retailers: $e');
      if (mounted) setState(() => _isLoadingRetailers = false);
    }
  }

  List<Retailer> get _filteredRetailers {
    if (_retailerSearchQuery.isEmpty) return _retailers;
    final query = _retailerSearchQuery.toLowerCase();
    return _retailers.where((r) =>
      (r.shopName.toLowerCase().contains(query)) ||
      (r.ownerName.toLowerCase().contains(query)) ||
      (r.phone.contains(query))
    ).toList();
  }

  List<Product> get _filteredProducts {
    if (_productSearchQuery.isEmpty) return _products;
    final query = _productSearchQuery.toLowerCase();
    return _products.where((p) =>
      p.name.toLowerCase().contains(query)
    ).toList();
  }

  void _addOrUpdateCartItem(Product product, bool isCrate, int quantity, [double? customPrice]) {
    if (quantity < 0) return;
    
    setState(() {
      final existingIndex = _cart.indexWhere((item) => item.product.id == product.id);
      
      if (quantity == 0) {
        if (existingIndex >= 0) {
           if (isCrate) {
             _cart[existingIndex].crates = 0;
           } else {
             _cart[existingIndex].pieces = 0;
           }
           if (_cart[existingIndex].crates == 0 && _cart[existingIndex].pieces == 0) {
             _cart.removeAt(existingIndex);
           }
        }
        return;
      }

      if (existingIndex >= 0) {
        if (isCrate) {
          _cart[existingIndex].crates = quantity;
        } else {
          _cart[existingIndex].pieces = quantity;
        }
        if (customPrice != null) {
          _cart[existingIndex].customPrice = customPrice;
        }
      } else {
        _cart.add(CartItem(
          product: product, 
          crates: isCrate ? quantity : 0, 
          pieces: isCrate ? 0 : quantity,
          customPrice: customPrice ?? product.price
        ));
      }
    });
  }

  double get _totalOriginalAmount {
    return _cart.fold(0, (sum, item) => sum + item.originalAmount);
  }

  double get _totalGstAmount {
    return _cart.fold(0, (sum, item) => sum + item.gstAmount);
  }

  double get _finalTotalAmount {
    double total = _totalOriginalAmount + _totalGstAmount;
    return _roundOffTotal ? total.roundToDouble() : total;
  }

  Future<Position?> _getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showErrorSnackBar('Location services are disabled.');
      return null;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _showErrorSnackBar('Location permissions are denied');
        return null;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _showErrorSnackBar('Location permissions are permanently denied.');
      return null;
    }

    try {
      return await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
    } catch (e) {
      _showErrorSnackBar('Failed to get location: $e');
      return null;
    }
  }

  void _showErrorSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(
        children: [
          const Icon(LucideIcons.alertCircle, color: Colors.white, size: 20),
          const SizedBox(width: 8),
          Expanded(child: Text(message)),
        ],
      ),
      backgroundColor: const Color(0xFFEF4444), // rose-500
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  Future<void> _submitOrder() async {
    if (_selectedRetailer == null) {
      _showErrorSnackBar('Please select a retailer first');
      return;
    }
    if (_cart.isEmpty) {
      _showErrorSnackBar('Please add products to the cart');
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // 1. Get GPS String
      final position = await _getCurrentLocation();
      final gpsString = position != null 
          ? '${position.latitude},${position.longitude}' 
          : 'Location unavailable';

      // 2. Prepare Payload exactly like React web app
      final orderItems = _cart.map((item) => {
        'productId': item.product.id,
        'quantity': item.totalPieces, // Send total pieces as quantity
        'priceAtTime': item.customPrice, // Use custom price if overridden
        'crates': item.crates,
        'pieces': item.pieces,
        'gstSelected': true,
        'gstPercentage': item.product.gstPercentage,
      }).toList();

      final payload = {
        'retailerId': _selectedRetailer!.id,
        'items': orderItems,
        'totalAmount': _finalTotalAmount,
        'paymentMode': _paymentMode,
        'gpsCoordinates': gpsString,
      };

      // 3. Submit
      final response = await _apiService.post('/orders', data: payload);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (!mounted) return;
        
        // Show Success Dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.checkCircle, color: Color(0xFF10B981), size: 40),
                  ),
                  const SizedBox(height: 24),
                  const Text('Order Placed!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                  const SizedBox(height: 8),
                  Text('GPS Logged: $gpsString', textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop(); // Close dialog
                        Navigator.of(context).pop(); // Close CreateOrderScreen
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('Back to Dashboard', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      } else {
        _showErrorSnackBar('Failed to place order. Server returned ${response.statusCode}');
      }
    } catch (e) {
      _showErrorSnackBar('Error submitting order: $e');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showNewRetailerDialog() {
    final nameCtrl = TextEditingController();
    final ownerCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    final balanceCtrl = TextEditingController();
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) {
          return Dialog(
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Add New Retailer', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                      IconButton(
                        icon: const Icon(LucideIcons.x, color: Color(0xFF64748B)),
                        onPressed: () => Navigator.pop(context),
                      )
                    ],
                  ),
                  const SizedBox(height: 20),
                  _buildInputLabel('Shop Name *'),
                  _buildDialogTextField(controller: nameCtrl, icon: LucideIcons.store),
                  const SizedBox(height: 16),
                  _buildInputLabel('Owner Name'),
                  _buildDialogTextField(controller: ownerCtrl, icon: LucideIcons.user),
                  const SizedBox(height: 16),
                  _buildInputLabel('Phone Number *'),
                  _buildDialogTextField(controller: phoneCtrl, icon: LucideIcons.phone, keyboardType: TextInputType.phone),
                  const SizedBox(height: 16),
                  _buildInputLabel('Address'),
                  _buildDialogTextField(controller: addressCtrl, icon: LucideIcons.mapPin, maxLines: 2),
                  const SizedBox(height: 16),
                  _buildInputLabel('Opening Balance'),
                  _buildDialogTextField(controller: balanceCtrl, icon: LucideIcons.indianRupee, keyboardType: TextInputType.number),
                  
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: isSaving ? null : () async {
                        if (nameCtrl.text.isEmpty || phoneCtrl.text.isEmpty) {
                          ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Shop Name and Phone are required')));
                          return;
                        }
                        setStateDialog(() => isSaving = true);
                        try {
                          final payload = {
                            'shopName': nameCtrl.text,
                            'ownerName': ownerCtrl.text,
                            'mobileNumber': phoneCtrl.text,
                            'address': addressCtrl.text,
                            'creditBalance': double.tryParse(balanceCtrl.text) ?? 0.0,
                          };
                          final res = await _apiService.post('/retailers', data: payload);
                          if (res.statusCode == 201 || res.statusCode == 200) {
                            await _fetchRetailers(); // Refresh list
                            
                            // Try to auto-select the newly created one
                            final newId = res.data['id'];
                            if (newId != null && mounted) {
                               setState(() {
                                 _selectedRetailer = _retailers.firstWhere((r) => r.id == newId, orElse: () => Retailer.fromJson(res.data));
                               });
                            }

                            if (mounted) Navigator.pop(ctx);
                          }
                        } catch (e) {
                          ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e')));
                          setStateDialog(() => isSaving = false);
                        }
                      },
                      child: isSaving 
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Save Retailer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  )
                ],
              ),
            ),
          );
        }
      ),
    );
  }

  Widget _buildInputLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
    );
  }

  Widget _buildDialogTextField({
    required TextEditingController controller,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        maxLines: maxLines,
        style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: const Color(0xFF94A3B8), size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Create Order',
          style: TextStyle(color: Color(0xFF1E293B), fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5),
        ),
      ),
      body: _isLoadingProducts || _isLoadingRetailers
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: CustomScrollView(
                    slivers: [
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            _buildRetailerSelection(),
                            if (_selectedRetailer == null) ...[
                               Center(
                                 child: Padding(
                                   padding: const EdgeInsets.only(top: 80),
                                   child: Column(
                                     children: [
                                       Container(
                                         padding: const EdgeInsets.all(24),
                                         decoration: const BoxDecoration(color: Color(0xFFF1F5F9), shape: BoxShape.circle),
                                         child: const Icon(LucideIcons.store, size: 48, color: Color(0xFFCBD5E1)),
                                       ),
                                       const SizedBox(height: 24),
                                       const Text('Select a Retailer', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                                       const SizedBox(height: 8),
                                       const Text('Search for a retailer above to start\nadding products to the order.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF64748B), fontSize: 14, height: 1.5)),
                                     ],
                                   ),
                                 ),
                               )
                            ] else ...[
                               const SizedBox(height: 24),
                               _buildOrderSettings(),
                               const SizedBox(height: 24),
                               const Text('Products', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                               const SizedBox(height: 12),
                               Container(
                                 decoration: BoxDecoration(
                                   color: Colors.white,
                                   borderRadius: BorderRadius.circular(16),
                                   border: Border.all(color: const Color(0xFFE2E8F0)),
                                 ),
                                 child: TextField(
                                   controller: _productSearchController,
                                   onChanged: (val) => setState(() => _productSearchQuery = val),
                                   style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
                                   decoration: InputDecoration(
                                     hintText: 'Search products...',
                                     hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.normal),
                                     prefixIcon: const Icon(LucideIcons.search, size: 20, color: Color(0xFF94A3B8)),
                                     border: InputBorder.none,
                                     contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 0),
                                     suffixIcon: _productSearchQuery.isNotEmpty
                                        ? IconButton(
                                            icon: const Icon(LucideIcons.x, size: 18, color: Color(0xFF94A3B8)),
                                            onPressed: () {
                                              setState(() {
                                                _productSearchController.clear();
                                                _productSearchQuery = '';
                                              });
                                            },
                                          ) 
                                        : null,
                                   ),
                                 ),
                               ),
                               const SizedBox(height: 16),
                            ],
                          ]),
                        ),
                      ),
                      if (_selectedRetailer != null)
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                          sliver: SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                return _buildProductCard(_filteredProducts[index]);
                              },
                              childCount: _filteredProducts.length,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                if (_cart.isNotEmpty) _buildBottomSummaryBar(),
              ],
            ),
    );
  }

  Widget _buildRetailerSelection() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Retailer Details', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
              InkWell(
                onTap: _showNewRetailerDialog,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF2FF), // indigo-50
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    children: [
                      Icon(LucideIcons.plus, size: 14, color: Color(0xFF4F46E5)), // indigo-600
                      SizedBox(width: 4),
                      Text('New', style: TextStyle(color: Color(0xFF4F46E5), fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          if (_selectedRetailer == null || _isSearchingRetailer) ...[
             // Search Box
             Container(
               decoration: BoxDecoration(
                 color: const Color(0xFFF8FAFC),
                 borderRadius: BorderRadius.circular(16),
                 border: Border.all(color: const Color(0xFFE2E8F0)),
               ),
               child: TextField(
                 controller: _retailerSearchController,
                 focusNode: _retailerSearchFocus,
                 onChanged: (val) => setState(() => _retailerSearchQuery = val),
                 style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
                 decoration: InputDecoration(
                   hintText: 'Search shop or owner...',
                   hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.normal),
                   prefixIcon: const Icon(LucideIcons.search, size: 20, color: Color(0xFF94A3B8)),
                   border: InputBorder.none,
                   contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 0),
                   suffixIcon: _isSearchingRetailer && _selectedRetailer != null
                      ? IconButton(
                          icon: const Icon(LucideIcons.x, size: 18, color: Color(0xFF94A3B8)),
                          onPressed: () {
                            setState(() {
                              _isSearchingRetailer = false;
                              _retailerSearchController.clear();
                            });
                          },
                        ) 
                      : null,
                 ),
               ),
             ),
             
             // Search Results Dropdown-like
             if (_retailerSearchQuery.isNotEmpty)
               Container(
                 margin: const EdgeInsets.only(top: 8),
                 decoration: BoxDecoration(
                   color: Colors.white,
                   borderRadius: BorderRadius.circular(16),
                   border: Border.all(color: const Color(0xFFE2E8F0)),
                 ),
                 constraints: const BoxConstraints(maxHeight: 200),
                 child: ListView.builder(
                   shrinkWrap: true,
                   padding: EdgeInsets.zero,
                   itemCount: _filteredRetailers.length,
                   itemBuilder: (context, index) {
                     final r = _filteredRetailers[index];
                     return ListTile(
                       title: Text(r.shopName, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                       subtitle: Text(r.phone, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                       dense: true,
                       onTap: () {
                         setState(() {
                           _selectedRetailer = r;
                           _isSearchingRetailer = false;
                           _retailerSearchController.clear();
                           _retailerSearchQuery = '';
                           _retailerSearchFocus.unfocus();
                         });
                       },
                     );
                   },
                 ),
               ),
          ] else ...[
             // Selected Retailer Display
             Container(
               padding: const EdgeInsets.all(16),
               decoration: BoxDecoration(
                 color: const Color(0xFFF8FAFC),
                 borderRadius: BorderRadius.circular(16),
                 border: Border.all(color: const Color(0xFFE2E8F0)),
               ),
               child: Row(
                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
                 children: [
                   Expanded(
                     child: Column(
                       crossAxisAlignment: CrossAxisAlignment.start,
                       children: [
                         Text(_selectedRetailer!.shopName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                         const SizedBox(height: 4),
                          Wrap(
                            spacing: 12,
                            runSpacing: 4,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(LucideIcons.user, size: 12, color: Color(0xFF94A3B8)),
                                  const SizedBox(width: 4),
                                  Text(_selectedRetailer!.ownerName, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w500)),
                                ],
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(LucideIcons.phone, size: 12, color: Color(0xFF94A3B8)),
                                  const SizedBox(width: 4),
                                  Text(_selectedRetailer!.phone, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w500)),
                                ],
                              ),
                            ],
                          ),
                       ],
                     ),
                   ),
                   IconButton(
                     icon: const Icon(LucideIcons.edit2, size: 18, color: Color(0xFF3B82F6)),
                     onPressed: () {
                       setState(() {
                         _isSearchingRetailer = true;
                         // _selectedRetailer remains so user can cancel
                       });
                     },
                     style: IconButton.styleFrom(
                       backgroundColor: Colors.white,
                       shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFFE2E8F0))),
                     ),
                   ),
                 ],
               ),
             ),
          ]
        ],
      ),
    );
  }

  Widget _buildOrderSettings() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Order Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
          const SizedBox(height: 16),
          
          // Payment Mode
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => setState(() => _paymentMode = 'Credit'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: _paymentMode == 'Credit' ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _paymentMode == 'Credit' ? const Color(0xFF0F172A) : const Color(0xFFE2E8F0)),
                    ),
                    alignment: Alignment.center,
                    child: Text('Credit', style: TextStyle(
                      color: _paymentMode == 'Credit' ? Colors.white : const Color(0xFF64748B),
                      fontWeight: FontWeight.bold,
                    )),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: InkWell(
                  onTap: () => setState(() => _paymentMode = 'Cash'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: _paymentMode == 'Cash' ? const Color(0xFF10B981) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _paymentMode == 'Cash' ? const Color(0xFF10B981) : const Color(0xFFE2E8F0)),
                    ),
                    alignment: Alignment.center,
                    child: Text('Cash', style: TextStyle(
                      color: _paymentMode == 'Cash' ? Colors.white : const Color(0xFF64748B),
                      fontWeight: FontWeight.bold,
                    )),
                  ),
                ),
              ),
            ],
          ),
          
          const Divider(height: 32, color: Color(0xFFF1F5F9)),
          
          // Round Off Toggle
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(LucideIcons.coins, size: 18, color: Color(0xFF64748B)),
                  SizedBox(width: 8),
                  Text('Round Off Total', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF334155))),
                ],
              ),
              Switch(
                value: _roundOffTotal,
                onChanged: (val) => setState(() => _roundOffTotal = val),
                activeColor: const Color(0xFF0F172A),
                activeTrackColor: const Color(0xFFCBD5E1),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProductList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Products', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
        const SizedBox(height: 16),
        ..._products.map((p) => _buildProductCard(p)),
      ],
    );
  }

  Widget _buildProductCard(Product product) {
    // Find if it's already in cart
    final cartIndex = _cart.indexWhere((item) => item.product.id == product.id);
    final cartItem = cartIndex >= 0 ? _cart[cartIndex] : null;
    
    final initialCrates = (cartItem?.crates ?? 0) > 0 ? cartItem!.crates.toString() : '';
    final initialPieces = (cartItem?.pieces ?? 0) > 0 ? cartItem!.pieces.toString() : '';
    final initialPrice = cartItem?.customPrice.toStringAsFixed(2) ?? product.price.toStringAsFixed(2);

    final isSelected = cartItem != null && (cartItem.crates > 0 || cartItem.pieces > 0);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFFF8FAFC) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isSelected ? const Color(0xFFCBD5E1) : const Color(0xFFE2E8F0), width: isSelected ? 2 : 1),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.01), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(product.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E293B))),
                      const SizedBox(height: 4),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(4)),
                            child: Text('GST: ${product.gstPercentage}%', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5))),
                          ),
                          Text('${product.bottlesPerCrate} pcs/crate', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          
          // Inputs
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Crates
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Crates', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                      const SizedBox(height: 6),
                      Container(
                        height: 40,
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFE2E8F0))),
                        child: TextFormField(
                          initialValue: initialCrates,
                          keyboardType: TextInputType.number,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                          decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.zero),
                          onChanged: (val) {
                            int valInt = int.tryParse(val) ?? 0;
                            double customP = cartItem?.customPrice ?? product.price;
                            _addOrUpdateCartItem(product, true, valInt, customP);
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Pieces
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Pieces', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                      const SizedBox(height: 6),
                      Container(
                        height: 40,
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFE2E8F0))),
                        child: TextFormField(
                          initialValue: initialPieces,
                          keyboardType: TextInputType.number,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                          decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.zero),
                          onChanged: (val) {
                            int valInt = int.tryParse(val) ?? 0;
                            double customP = cartItem?.customPrice ?? product.price;
                            _addOrUpdateCartItem(product, false, valInt, customP);
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Price Override
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Price/Pc', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                      const SizedBox(height: 6),
                      Container(
                        height: 40,
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFE2E8F0))),
                        child: TextFormField(
                          initialValue: initialPrice,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF10B981)), // Emerald
                          decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.zero, prefixText: '₹ ', prefixStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                          onChanged: (val) {
                            if (cartIndex >= 0) {
                               double customP = double.tryParse(val) ?? product.price;
                               setState(() {
                                 _cart[cartIndex].customPrice = customP;
                               });
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          if (isSelected) 
             Container(
               width: double.infinity,
               padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
               decoration: const BoxDecoration(
                 color: Color(0xFF0F172A),
                 borderRadius: BorderRadius.only(bottomLeft: Radius.circular(22), bottomRight: Radius.circular(22)),
               ),
               child: Row(
                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
                 children: [
                   Row(
                     children: [
                       Text('Total Pcs: ${cartItem.totalPieces}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w600)),
                       const SizedBox(width: 8),
                       Text('GST: ₹${cartItem.gstAmount.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w600)),
                     ],
                   ),
                   Text('₹${(cartItem.originalAmount + cartItem.gstAmount).toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                 ],
               ),
             )
        ],
      ),
    );
  }

  Widget _buildBottomSummaryBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, -5))],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Subtotal
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Subtotal', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                  const SizedBox(width: 8),
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerRight,
                      child: Text('₹${_totalOriginalAmount.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // GST
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('GST Amount', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                  const SizedBox(width: 8),
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerRight,
                      child: Text('+ ₹${_totalGstAmount.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFF334155), fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1, color: Color(0xFFE2E8F0)),
              ),
              // Final Total
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    flex: 6,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('TOTAL AMOUNT', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                        const SizedBox(height: 4),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Wrap(
                            crossAxisAlignment: WrapCrossAlignment.end,
                            children: [
                              Text('₹${_finalTotalAmount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), height: 1)),
                              if (_roundOffTotal)
                                const Padding(
                                  padding: EdgeInsets.only(left: 8, bottom: 4),
                                  child: Text('(Round)', style: TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(width: 8),

                  // Submit Button
                  Expanded(
                    flex: 5,
                    child: SizedBox(
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitOrder,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4F46E5), // Indigo 600
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                        ),
                        child: _isSubmitting 
                           ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                           : const FittedBox(
                               fit: BoxFit.scaleDown,
                               child: Row(
                                 mainAxisAlignment: MainAxisAlignment.center,
                                 children: [
                                   Text('Place Order', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                                   SizedBox(width: 6),
                                   Icon(LucideIcons.arrowRight, size: 18, color: Colors.white),
                                 ],
                               ),
                             ),
                      ),
                    ),
                  )
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}

class CartItem {
  final Product product;
  int crates;
  int pieces;
  double customPrice;

  CartItem({
    required this.product, 
    required this.crates,
    required this.pieces,
    required this.customPrice,
  });

  int get totalPieces => (crates * product.bottlesPerCrate) + pieces;
  double get originalAmount => totalPieces * customPrice;
  double get gstAmount => (originalAmount * product.gstPercentage) / 100;
}
