class Product {
  final int id;
  final String name;
  final String? description;
  final double price;
  final int stockQuantity;
  final String? category;
  final double gstPercentage;
  final int bottlesPerCrate;

  Product({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.stockQuantity,
    this.category,
    this.gstPercentage = 18.0,
    this.bottlesPerCrate = 24,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
      stockQuantity: int.tryParse(json['stockQuantity']?.toString() ?? '0') ?? 0,
      category: json['category']?.toString(),
      gstPercentage: double.tryParse(json['gstPercentage']?.toString() ?? '18') ?? 18.0,
      bottlesPerCrate: int.tryParse(json['bottlesPerCrate']?.toString() ?? '24') ?? 24,
    );
  }
}
