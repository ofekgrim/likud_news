import 'package:injectable/injectable.dart';

import '../repositories/user_profile_repository.dart';

@lazySingleton
class ClaimReferralCode {
  final UserProfileRepository _repository;

  ClaimReferralCode(this._repository);

  /// Submits [code] to the backend. Errors are intentionally ignored so
  /// an invalid or duplicate code never blocks the registration flow.
  Future<void> call(String code) async {
    await _repository.claimReferralCode(code);
  }
}
