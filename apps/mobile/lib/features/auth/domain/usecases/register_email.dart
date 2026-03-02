import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/app_user.dart';
import '../entities/auth_tokens.dart';
import '../repositories/auth_repository.dart';

@injectable
class RegisterEmail
    implements
        UseCase<({AppUser user, AuthTokens tokens}), RegisterEmailParams> {
  final AuthRepository _repository;

  RegisterEmail(this._repository);

  @override
  Future<Either<Failure, ({AppUser user, AuthTokens tokens})>> call(
    RegisterEmailParams params,
  ) {
    return _repository.registerEmail(
      email: params.email,
      password: params.password,
      deviceId: params.deviceId,
      displayName: params.displayName,
      phone: params.phone,
      platform: params.platform,
    );
  }
}

class RegisterEmailParams extends Equatable {
  final String email;
  final String password;
  final String deviceId;
  final String? displayName;
  final String? phone;
  final String? platform;

  const RegisterEmailParams({
    required this.email,
    required this.password,
    required this.deviceId,
    this.displayName,
    this.phone,
    this.platform,
  });

  @override
  List<Object?> get props => [email, password, deviceId, displayName, phone, platform];
}
