import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/app_user.dart';
import '../entities/auth_tokens.dart';
import '../repositories/auth_repository.dart';

@injectable
class VerifyOtp
    implements UseCase<({AppUser user, AuthTokens tokens}), VerifyOtpParams> {
  final AuthRepository _repository;

  VerifyOtp(this._repository);

  @override
  Future<Either<Failure, ({AppUser user, AuthTokens tokens})>> call(
    VerifyOtpParams params,
  ) {
    return _repository.verifyOtp(
      phone: params.phone,
      code: params.code,
      deviceId: params.deviceId,
      platform: params.platform,
    );
  }
}

class VerifyOtpParams extends Equatable {
  final String phone;
  final String code;
  final String deviceId;
  final String? platform;

  const VerifyOtpParams({
    required this.phone,
    required this.code,
    required this.deviceId,
    this.platform,
  });

  @override
  List<Object?> get props => [phone, code, deviceId, platform];
}
