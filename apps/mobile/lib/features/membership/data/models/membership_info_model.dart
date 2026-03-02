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

  const MembershipInfoModel({
    this.membershipId,
    this.status = MembershipStatus.none,
    this.verifiedAt,
    this.branch,
    this.district,
    this.votingEligible = false,
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
}
