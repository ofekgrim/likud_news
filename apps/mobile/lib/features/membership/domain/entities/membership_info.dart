import 'package:equatable/equatable.dart';

/// Membership status for a Likud party member.
enum MembershipStatus {
  none,
  pending,
  verified,
  expired;

  /// Returns the localization key for this status.
  String get localizationKey {
    switch (this) {
      case MembershipStatus.none:
        return 'membership_not_verified';
      case MembershipStatus.pending:
        return 'membership_pending';
      case MembershipStatus.verified:
        return 'membership_verified';
      case MembershipStatus.expired:
        return 'membership_expired';
    }
  }
}

/// Payment status for a Likud member.
enum PaymentStatus {
  paid,
  due,
  overdue;
}

/// Polling station information for a member's assigned voting location.
class PollingStation extends Equatable {
  final String name;
  final String address;
  final double? latitude;
  final double? longitude;
  final String? openingHours;

  const PollingStation({
    required this.name,
    required this.address,
    this.latitude,
    this.longitude,
    this.openingHours,
  });

  @override
  List<Object?> get props => [name, address, latitude, longitude, openingHours];
}

/// Immutable membership info entity used throughout the domain and
/// presentation layers.
///
/// Represents the user's Likud membership status, branch assignment,
/// verification details, eligibility data, and assigned polling station.
class MembershipInfo extends Equatable {
  final String? membershipId;
  final MembershipStatus status;
  final DateTime? verifiedAt;
  final String? branch;
  final String? district;
  final bool votingEligible;
  final bool isEligible;
  final PaymentStatus paymentStatus;
  final bool code99Freeze;
  final PollingStation? pollingStation;
  final DateTime? membershipJoinDate;
  final DateTime? membershipExpiryDate;
  final int daysUntilEligible;
  final int monthsSinceJoin;

  const MembershipInfo({
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

  @override
  List<Object?> get props => [
        membershipId,
        status,
        verifiedAt,
        branch,
        district,
        votingEligible,
        isEligible,
        paymentStatus,
        code99Freeze,
        pollingStation,
        membershipJoinDate,
        membershipExpiryDate,
        daysUntilEligible,
        monthsSinceJoin,
      ];
}
