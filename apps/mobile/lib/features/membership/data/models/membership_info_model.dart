import '../../domain/entities/membership_info.dart';

/// Data model for membership info, handles JSON serialization.
///
/// Maps API responses from `/app-users/me` to the domain
/// [MembershipInfo] entity via [toEntity].
class MembershipInfoModel {
  final String? membershipId;
  final MembershipStatus status;
  final DateTime? verifiedAt;
  final String? branch;
  final String? district;
  final bool votingEligible;
  final bool isEligible;
  final PaymentStatus paymentStatus;
  final bool code99Freeze;
  final PollingStationModel? pollingStation;
  final DateTime? membershipJoinDate;
  final DateTime? membershipExpiryDate;
  final int daysUntilEligible;
  final int monthsSinceJoin;

  const MembershipInfoModel({
    this.membershipId,
    this.status = MembershipStatus.none,
    this.verifiedAt,
    this.branch,
    this.district,
    this.votingEligible = false,
    this.isEligible = false,
    this.paymentStatus = PaymentStatus.paid,
    this.code99Freeze = false,
    this.pollingStation,
    this.membershipJoinDate,
    this.membershipExpiryDate,
    this.daysUntilEligible = 0,
    this.monthsSinceJoin = 0,
  });

  /// Creates a [MembershipInfoModel] from a JSON map.
  ///
  /// Handles both `{data: {...}}` wrapper and raw `{...}` responses.
  factory MembershipInfoModel.fromJson(Map<String, dynamic> json) {
    final data = json.containsKey('data')
        ? json['data'] as Map<String, dynamic>
        : json;

    return MembershipInfoModel(
      membershipId: data['membershipId'] as String?,
      status: _parseStatus(data['membershipStatus'] as String?),
      verifiedAt: data['verifiedAt'] != null
          ? DateTime.tryParse(data['verifiedAt'] as String)
          : null,
      branch: data['branch'] as String?,
      district: data['district'] as String?,
      votingEligible: data['votingEligible'] as bool? ?? false,
      isEligible: data['isEligible'] as bool? ?? false,
      paymentStatus: _parsePaymentStatus(data['paymentStatus'] as String?),
      code99Freeze: data['code99Freeze'] as bool? ?? false,
      pollingStation: data['pollingStation'] != null
          ? PollingStationModel.fromJson(
              data['pollingStation'] as Map<String, dynamic>,
            )
          : null,
      membershipJoinDate: data['membershipJoinDate'] != null
          ? DateTime.tryParse(data['membershipJoinDate'] as String)
          : null,
      membershipExpiryDate: data['membershipExpiryDate'] != null
          ? DateTime.tryParse(data['membershipExpiryDate'] as String)
          : null,
      daysUntilEligible: data['daysUntilEligible'] as int? ?? 0,
      monthsSinceJoin: data['monthsSinceJoin'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'membershipId': membershipId,
      'membershipStatus': status.name,
      'verifiedAt': verifiedAt?.toIso8601String(),
      'branch': branch,
      'district': district,
      'votingEligible': votingEligible,
      'isEligible': isEligible,
      'paymentStatus': paymentStatus.name,
      'code99Freeze': code99Freeze,
      'pollingStation': pollingStation?.toJson(),
      'membershipJoinDate': membershipJoinDate?.toIso8601String(),
      'membershipExpiryDate': membershipExpiryDate?.toIso8601String(),
      'daysUntilEligible': daysUntilEligible,
      'monthsSinceJoin': monthsSinceJoin,
    };
  }

  MembershipInfo toEntity() {
    return MembershipInfo(
      membershipId: membershipId,
      status: status,
      verifiedAt: verifiedAt,
      branch: branch,
      district: district,
      votingEligible: votingEligible,
      isEligible: isEligible,
      paymentStatus: paymentStatus,
      code99Freeze: code99Freeze,
      pollingStation: pollingStation?.toEntity(),
      membershipJoinDate: membershipJoinDate,
      membershipExpiryDate: membershipExpiryDate,
      daysUntilEligible: daysUntilEligible,
      monthsSinceJoin: monthsSinceJoin,
    );
  }

  /// Parses a membership status string into a [MembershipStatus] enum.
  static MembershipStatus _parseStatus(String? status) {
    if (status == null) return MembershipStatus.none;
    switch (status.toLowerCase()) {
      case 'pending':
        return MembershipStatus.pending;
      case 'verified':
        return MembershipStatus.verified;
      case 'expired':
        return MembershipStatus.expired;
      default:
        return MembershipStatus.none;
    }
  }

  /// Parses a payment status string into a [PaymentStatus] enum.
  static PaymentStatus _parsePaymentStatus(String? status) {
    if (status == null) return PaymentStatus.paid;
    switch (status.toLowerCase()) {
      case 'due':
        return PaymentStatus.due;
      case 'overdue':
        return PaymentStatus.overdue;
      default:
        return PaymentStatus.paid;
    }
  }
}

/// Data model for a polling station.
class PollingStationModel {
  final String name;
  final String address;
  final double? latitude;
  final double? longitude;
  final String? openingHours;

  const PollingStationModel({
    required this.name,
    required this.address,
    this.latitude,
    this.longitude,
    this.openingHours,
  });

  factory PollingStationModel.fromJson(Map<String, dynamic> json) {
    return PollingStationModel(
      name: json['name'] as String? ?? '',
      address: json['address'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      openingHours: json['openingHours'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'openingHours': openingHours,
    };
  }

  PollingStation toEntity() {
    return PollingStation(
      name: name,
      address: address,
      latitude: latitude,
      longitude: longitude,
      openingHours: openingHours,
    );
  }
}
