/// Defines what actions each app user role can perform.
enum AppPermission {
  postComment,
  likeComment,
  endorseCandidate,
  voteInPoll,
  voteInPrimaries,
  editProfile,
}

/// Mirrors backend AppUserRole enum values.
enum AppUserRole {
  guest,
  member,
  verifiedMember;

  int get level {
    switch (this) {
      case AppUserRole.guest:
        return 0;
      case AppUserRole.member:
        return 1;
      case AppUserRole.verifiedMember:
        return 2;
    }
  }

  static AppUserRole fromString(String value) {
    switch (value) {
      case 'member':
        return AppUserRole.member;
      case 'verified_member':
      case 'verifiedMember':
        return AppUserRole.verifiedMember;
      default:
        return AppUserRole.guest;
    }
  }
}

class PermissionService {
  PermissionService._();

  static const Map<AppPermission, AppUserRole> _minimumRoles = {
    AppPermission.postComment: AppUserRole.guest,
    AppPermission.likeComment: AppUserRole.guest,
    AppPermission.endorseCandidate: AppUserRole.member,
    AppPermission.voteInPoll: AppUserRole.guest,
    AppPermission.voteInPrimaries: AppUserRole.verifiedMember,
    AppPermission.editProfile: AppUserRole.guest,
  };

  /// Returns true if the user's role meets the minimum for [action].
  /// Returns false if [role] is null (anonymous/not logged in).
  static bool canPerform(AppPermission action, AppUserRole? role) {
    if (role == null) return false;
    final minRole = _minimumRoles[action] ?? AppUserRole.guest;
    return role.level >= minRole.level;
  }

  /// Returns the minimum role required for an action.
  static AppUserRole minimumRoleFor(AppPermission action) {
    return _minimumRoles[action] ?? AppUserRole.guest;
  }
}
