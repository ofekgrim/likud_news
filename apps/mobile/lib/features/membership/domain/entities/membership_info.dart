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

/// Immutable membership info entity used throughout the domain and
/// presentation layers.
///
/// Represents the user's Likud membership status, branch assignment,
/// and verification details.
class MembershipInfo extends Equatable {
  final String? membershipId;
  final MembershipStatus status;
  final DateTime? verifiedAt;
  final String? branch;
  final String? district;
  final bool votingEligible;

  const MembershipInfo({
    this.membershipId,
    this.status = MembershipStatus.none,
    this.verifiedAt,
    this.branch,
    this.district,
    this.votingEligible = false,
  });

  @override
  List<Object?> get props => [
        membershipId,
        status,
        verifiedAt,
        branch,
        district,
        votingEligible,
      ];
}
