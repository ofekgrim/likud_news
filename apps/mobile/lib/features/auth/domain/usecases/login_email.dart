import 'package:dartz/dartz.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/app_user.dart';
import '../entities/auth_tokens.dart';
import '../repositories/auth_repository.dart';

@injectable
class LoginEmail
    implements UseCase<({AppUser user, AuthTokens tokens}), LoginEmailParams> {
  final AuthRepository _repository;

  LoginEmail(this._repository);

  @override
  Future<Either<Failure, ({AppUser user, AuthTokens tokens})>> call(
    LoginEmailParams params,
  ) {
    return _repository.loginEmail(
      email: params.email,
      password: params.password,
      deviceId: params.deviceId,
      platform: params.platform,
    );
  }
}

class LoginEmailParams extends Equatable {
  final String email;
  final String password;
  final String deviceId;
  final String? platform;

  const LoginEmailParams({
    required this.email,
    required this.password,
    required this.deviceId,
    this.platform,
  });

  @override
  List<Object?> get props => [email, password, deviceId, platform];
}
