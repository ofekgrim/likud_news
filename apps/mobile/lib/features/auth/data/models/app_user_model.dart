import '../../domain/entities/app_user.dart';

class AppUserModel {
  final String id;
  final String? phone;
  final String? email;
  final String? displayName;
  final String? avatarUrl;
  final String? bio;
  final String role;
  final String? membershipId;
  final String membershipStatus;
  final DateTime? membershipVerifiedAt;
  final List<String> preferredCategories;
  final Map<String, dynamic> notificationPrefs;
  final DateTime? createdAt;

  const AppUserModel({
    required this.id,
    this.phone,
    this.email,
    this.displayName,
    this.avatarUrl,
    this.bio,
    this.role = 'guest',
    this.membershipId,
    this.membershipStatus = 'unverified',
    this.membershipVerifiedAt,
    this.preferredCategories = const [],
    this.notificationPrefs = const {},
    this.createdAt,
  });

  factory AppUserModel.fromJson(Map<String, dynamic> json) {
    return AppUserModel(
      id: json['id'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      displayName: json['displayName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      bio: json['bio'] as String?,
      role: json['role'] as String? ?? 'guest',
      membershipId: json['membershipId'] as String?,
      membershipStatus: json['membershipStatus'] as String? ?? 'unverified',
      membershipVerifiedAt: json['membershipVerifiedAt'] != null
          ? DateTime.tryParse(json['membershipVerifiedAt'] as String)
          : null,
      preferredCategories: (json['preferredCategories'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      notificationPrefs:
          json['notificationPrefs'] as Map<String, dynamic>? ?? const {},
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'phone': phone,
        'email': email,
        'displayName': displayName,
        'avatarUrl': avatarUrl,
        'bio': bio,
        'role': role,
        'membershipId': membershipId,
        'membershipStatus': membershipStatus,
        'membershipVerifiedAt': membershipVerifiedAt?.toIso8601String(),
        'preferredCategories': preferredCategories,
        'notificationPrefs': notificationPrefs,
        'createdAt': createdAt?.toIso8601String(),
      };

  AppUser toEntity() => AppUser(
        id: id,
        phone: phone,
        email: email,
        displayName: displayName,
        avatarUrl: avatarUrl,
        bio: bio,
        role: _parseRole(role),
        membershipId: membershipId,
        membershipStatus: _parseMembershipStatus(membershipStatus),
        membershipVerifiedAt: membershipVerifiedAt,
        preferredCategories: preferredCategories,
        notificationPrefs: notificationPrefs,
        createdAt: createdAt,
      );

  static AppUserRole _parseRole(String role) {
    switch (role) {
      case 'member':
        return AppUserRole.member;
      case 'verified_member':
        return AppUserRole.verifiedMember;
      default:
        return AppUserRole.guest;
    }
  }

  static MembershipStatus _parseMembershipStatus(String status) {
    switch (status) {
      case 'pending':
        return MembershipStatus.pending;
      case 'verified':
        return MembershipStatus.verified;
      case 'expired':
        return MembershipStatus.expired;
      default:
        return MembershipStatus.unverified;
    }
  }
}
