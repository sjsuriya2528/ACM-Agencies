import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/data_service.dart';

class PaymentEntryScreen extends StatefulWidget {
  @override
  _PaymentEntryScreenState createState() => _PaymentEntryScreenState();
}

class _PaymentEntryScreenState extends State<PaymentEntryScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedInvoiceId; // Using String to verify type safety later, but ID is int
  double? _amount;
  String _paymentMode = 'Cash'; // Default
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() =>
        Provider.of<DataService>(context, listen: false).fetchPendingInvoices());
  }

  void _submitPayment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedInvoiceId == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please select an invoice')));
      return;
    }

    _formKey.currentState!.save();

    setState(() {
      _isSubmitting = true;
    });

    try {
      final paymentData = {
        'invoiceId': int.parse(_selectedInvoiceId!), // Ensure int
        'amount': _amount,
        'paymentMode': _paymentMode,
        'transactionId': _paymentMode != 'Cash' ? 'TXN-\${DateTime.now().millisecondsSinceEpoch}' : null,
      };

      await Provider.of<DataService>(context, listen: false).submitPayment(paymentData);
      
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Recorded Successfully!')));
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Failed: \$e')));
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dataService = Provider.of<DataService>(context);
    final invoices = dataService.invoices;

    return Scaffold(
      appBar: AppBar(title: Text('Record Payment')),
      body: dataService.isLoading
          ? Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    // Invoice Selection
                    DropdownButtonFormField<String>(
                      decoration: InputDecoration(labelText: 'Select Invoice'),
                      value: _selectedInvoiceId,
                      items: invoices.map((invoice) {
                        final shopName = invoice['Order']?['retailer']?['shopName'] ?? 'Unknown Shop';
                        final balance = invoice['balanceAmount'];
                        return DropdownMenuItem(
                          value: invoice['id'].toString(),
                          child: Text('#${invoice['id']} - $shopName (Bal: ₹$balance)'),
                        );
                      }).toList(),
                      onChanged: (value) => setState(() => _selectedInvoiceId = value),
                      validator: (value) => value == null ? 'Required' : null,
                    ),
                    SizedBox(height: 20),

                    // Amount Field
                    TextFormField(
                      decoration: InputDecoration(labelText: 'Amount (₹)'),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) return 'Please enter amount';
                        if (double.tryParse(value) == null) return 'Invalid number';
                        return null;
                      },
                      onSaved: (value) => _amount = double.parse(value!),
                    ),
                    SizedBox(height: 20),

                    // Payment Mode
                    DropdownButtonFormField<String>(
                      decoration: InputDecoration(labelText: 'Payment Mode'),
                      value: _paymentMode,
                      items: ['Cash', 'UPI', 'Cheque'].map((mode) {
                        return DropdownMenuItem(value: mode, child: Text(mode));
                      }).toList(),
                      onChanged: (value) => setState(() => _paymentMode = value!),
                    ),
                    SizedBox(height: 30),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(padding: EdgeInsets.symmetric(vertical: 15)),
                        onPressed: _isSubmitting ? null : _submitPayment,
                        child: _isSubmitting ? CircularProgressIndicator() : Text('Record Payment'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
