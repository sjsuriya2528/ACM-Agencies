class Product {
  final int id;
  final String name;
  final String sku;
  final double price;
  final int stockQuantity;
  final int bottlesPerCrate;

  Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.price,
    required this.stockQuantity,
    this.bottlesPerCrate = 24, // Default
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      sku: json['sku'],
      price: double.tryParse(json['price'].toString()) ?? 0.0,
      stockQuantity: json['stockQuantity'] ?? 0,
      bottlesPerCrate: json['bottlesPerCrate'] ?? 24,
    );
  }
}
