class Retailer {
  final int id;
  final String shopName;
  final String ownerName;
  final String phone;
  final String address;
  final double creditBalance;

  Retailer({
    required this.id,
    required this.shopName,
    required this.ownerName,
    required this.phone,
    required this.address,
    required this.creditBalance,
  });

  factory Retailer.fromJson(Map<String, dynamic> json) {
    return Retailer(
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      shopName: json['shopName']?.toString() ?? '',
      ownerName: json['ownerName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? json['mobileNumber']?.toString() ?? '',
      address: json['address']?.toString() ?? '',
      creditBalance: double.tryParse(json['creditBalance']?.toString() ?? '0') ?? 0.0,
    );
  }
}
