import 'package:equatable/equatable.dart';

enum AppUserRole { guest, member, verifiedMember }

enum MembershipStatus { unverified, pending, verified, expired }

class AppUser extends Equatable {
  final String id;
  final String? phone;
  final String? email;
  final String? displayName;
  final String? avatarUrl;
  final String? bio;
  final AppUserRole role;
  final String? membershipId;
  final MembershipStatus membershipStatus;
  final DateTime? membershipVerifiedAt;
  final List<String> preferredCategories;
  final Map<String, dynamic> notificationPrefs;
  final DateTime? createdAt;

  const AppUser({
    required this.id,
    this.phone,
    this.email,
    this.displayName,
    this.avatarUrl,
    this.bio,
    this.role = AppUserRole.guest,
    this.membershipId,
    this.membershipStatus = MembershipStatus.unverified,
    this.membershipVerifiedAt,
    this.preferredCategories = const [],
    this.notificationPrefs = const {},
    this.createdAt,
  });

  bool get isAuthenticated => role != AppUserRole.guest;
  bool get isVerifiedMember => role == AppUserRole.verifiedMember;

  @override
  List<Object?> get props => [
        id,
        phone,
        email,
        displayName,
        avatarUrl,
        bio,
        role,
        membershipId,
        membershipStatus,
        membershipVerifiedAt,
        preferredCategories,
        notificationPrefs,
        createdAt,
      ];
}
