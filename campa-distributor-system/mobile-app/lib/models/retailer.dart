class Retailer {
  final int id;
  final String shopName;
  final String ownerName;
  final String? phone;
  final String? address;
  final double? gpsLatitude;
  final double? gpsLongitude;

  Retailer({
    required this.id,
    required this.shopName,
    required this.ownerName,
    this.phone,
    this.address,
    this.gpsLatitude,
    this.gpsLongitude,
  });

  factory Retailer.fromJson(Map<String, dynamic> json) {
    return Retailer(
      id: json['id'],
      shopName: json['shopName'],
      ownerName: json['ownerName'],
      phone: json['phone'],
      address: json['address'],
      gpsLatitude: json['gpsLatitude'] != null ? double.tryParse(json['gpsLatitude'].toString()) : null,
      gpsLongitude: json['gpsLongitude'] != null ? double.tryParse(json['gpsLongitude'].toString()) : null,
    );
  }
}
