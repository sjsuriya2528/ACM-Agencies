import 'dart:convert';
import 'package:flutter/material.dart';
import 'api_service.dart';
import '../models/retailer.dart';
import '../models/product.dart';

class DataService with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Retailer> _retailers = [];
  List<Product> _products = [];
  bool _isLoading = false;

  List<Retailer> get retailers => _retailers;
  List<Product> get products => _products;
  bool get isLoading => _isLoading;

  Future<void> fetchRetailers() async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _apiService.get('/retailers');
      if (data is List) {
        _retailers = data.map((json) => Retailer.fromJson(json)).toList();
      }
    } catch (e) {
      print('Error fetching retailers: \$e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Retailer> createRetailer(Map<String, dynamic> retailerData) async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _apiService.post('/retailers', retailerData);
      print('API Response for createRetailer: $data');
      
      // Refetch all retailers to ensure synchronization
      await fetchRetailers();
      
      // We need to return the new retailer so the UI can select it.
      // We can parse the response 'data' to get the ID, then find it in the updated list.
      final createdRetailer = Retailer.fromJson(data);
      return _retailers.firstWhere((r) => r.id == createdRetailer.id, orElse: () => createdRetailer);

    } catch (e) {
      print('Error creating retailer: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }


  Future<void> fetchProducts() async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _apiService.get('/products');
      if (data is List) {
        _products = data.map((json) => Product.fromJson(json)).toList();
      }
    } catch (e) {
      print('Error fetching products: \$e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  List<dynamic> _orders = [];
  List<dynamic> get orders => _orders;

  Future<void> fetchOrders() async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _apiService.get('/orders');
      if (data is List) {
        _orders = data;
      }
    } catch (e) {
      print('Error fetching orders: \$e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  List<dynamic> _deliveries = [];
  List<dynamic> get deliveries => _deliveries;

  Future<void> fetchDeliveries() async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _apiService.get('/deliveries');
      if (data is List) {
        _deliveries = data;
      }
    } catch (e) {
      print('Error fetching deliveries: \$e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> submitOrder(Map<String, dynamic> orderData) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _apiService.post('/orders', orderData);
    } catch (e) {
      print('Error submitting order: \$e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  List<dynamic> _invoices = [];
  List<dynamic> get invoices => _invoices;

  Future<void> fetchPendingInvoices() async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _apiService.get('/invoices?status=Pending');
      if (data is List) {
        _invoices = data;
      }
    } catch (e) {
      print('Error fetching invoices: \$e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateDeliveryStatus(int id, String status, double lat, double lng) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _apiService.put('/deliveries/$id/status', {
        'status': status,
        'gpsLatitude': lat,
        'gpsLongitude': lng,
      });
      await fetchDeliveries(); // Refresh list
    } catch (e) {
      print('Error updating delivery status: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> submitPayment(Map<String, dynamic> paymentData) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _apiService.post('/payments', paymentData);
      await fetchPendingInvoices();
    } catch (e) {
      print('Error submitting payment: \$e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
